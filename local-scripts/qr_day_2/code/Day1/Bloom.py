import os
import cv2
import numpy as np
import zxingcpp
from datetime import datetime, timezone, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. ฟังก์ชันช่วยสร้าง เวลามาตรฐานประเทศไทย (ISO 8601) ---
def get_thai_iso_string():
    tz_thai = timezone(timedelta(hours=7))
    now_thai = datetime.now(tz_thai)
    return now_thai.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+07:00'

# --- 2. ฟังก์ชันสแกนอ่าน QR Code จากภาพพร้อม Multi-Pass ---
def decode_qr_multipass(img):
    if img is None:
        return None
    
    # Pass 1: Direct read
    results = zxingcpp.read_barcodes(img)
    if results:
        return results[0].text.strip()
        
    # Pass 2: Sharpening
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(img, -1, kernel)
    results = zxingcpp.read_barcodes(sharpened)
    if results:
        return results[0].text.strip()

    # Pass 3: Multi-scale (0.5x, 0.75x, 1.25x, 1.5x, 2.0x) & Rotations
    for scale in [0.75, 0.5, 1.25, 1.5, 2.0]:
        scaled = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        r = zxingcpp.read_barcodes(scaled)
        if r:
            return r[0].text.strip()
            
        r_sh = zxingcpp.read_barcodes(cv2.filter2D(scaled, -1, kernel))
        if r_sh:
            return r_sh[0].text.strip()

        for angle in [90, 180, 270]:
            if angle == 90: rot = cv2.rotate(scaled, cv2.ROTATE_90_CLOCKWISE)
            elif angle == 180: rot = cv2.rotate(scaled, cv2.ROTATE_180)
            elif angle == 270: rot = cv2.rotate(scaled, cv2.ROTATE_90_COUNTERCLOCKWISE)
            r = zxingcpp.read_barcodes(rot)
            if r:
                return r[0].text.strip()
            
    # Pass 4: Contrast Stretching & OTSU Thresholding
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    for alpha in [1.5, 2.0, 2.5]:
        c_img = cv2.convertScaleAbs(gray, alpha=alpha, beta=-40)
        r = zxingcpp.read_barcodes(c_img)
        if r:
            return r[0].text.strip()
        _, otsu = cv2.threshold(c_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        r = zxingcpp.read_barcodes(otsu)
        if r:
            return r[0].text.strip()

    # Pass 5: Adaptive Thresholding
    for bs in [11, 21, 31, 51]:
        th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, bs, 2)
        r = zxingcpp.read_barcodes(th)
        if r:
            return r[0].text.strip()

    return None

def process_qr_codes(folder_path):
    normal_qrs = []   # เก็บข้อมูล QR บุคคลทั่วไป (UID_LINE)
    walkin_qrs = []   # เก็บข้อมูล QR ประเภท Walk-in
    failed_files = [] # เก็บชื่อไฟล์ที่อ่านไม่ได้

    valid_extensions = ('.jpg', '.jpeg', '.png')
    image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(valid_extensions) and not f.endswith('_original.jpg')]
    total_files = len(image_files)

    if total_files == 0:
        print("ไม่พบไฟล์รูปภาพในโฟลเดอร์ที่ระบุ")
        return [], [], []

    for filename in image_files:
        filepath = os.path.join(folder_path, filename)
        img = cv2.imread(filepath)
        
        qr_data = decode_qr_multipass(img) if img is not None else None

        if qr_data:
            if qr_data.startswith('WALKIN_TEMP:'):
                parts = qr_data.split(':')
                uid = parts[1] if len(parts) > 1 else qr_data
                
                walkin_qrs.append({
                    'filename': filename,
                    'uid': uid,
                    'raw_data': qr_data,
                    'is_walkin': True
                })
            else:
                uid = qr_data.split(':')[0]
                
                normal_qrs.append({
                    'filename': filename,
                    'uid': uid,
                    'raw_data': qr_data,
                    'is_walkin': False
                })
        else:
            failed_files.append(filename)

    total_success = len(normal_qrs) + len(walkin_qrs)

    print("=" * 55)
    print(f"📊 สรุปผลการสแกน QR Code จากภาพ (Day 1)")
    print(f"อ่านสำเร็จทั้งหมด: {total_success} / {total_files} ไฟล์")
    print(f" - ทั่วไป (Normal): {len(normal_qrs)} คน")
    print(f" - Walk-in: {len(walkin_qrs)} คน")
    print(f"อ่านไม่สำเร็จ: {len(failed_files)} / {total_files} ไฟล์")
    print("=" * 55)

    if walkin_qrs:
        print(f"\n🚶 รายชื่อผู้สมัครแบบ Walk-in (ทั้งหมด {len(walkin_qrs)} คน):")
        for item in walkin_qrs:
            print(f" - ไฟล์: {item['filename']} | UID: {item['uid']}")

    if failed_files:
        print("\n❌ รายชื่อไฟล์ที่อ่าน QR Code ไม่ได้:")
        for failed in failed_files:
            print(f" - {failed}")
    
    return normal_qrs, walkin_qrs, failed_files

# --- 3. ฟังก์ชันค้นหาข้อมูลนิสิตใน Firestore DB ---
def find_student_in_db(db, uid):
    clean_uid = uid.strip() if isinstance(uid, str) else str(uid).strip()
    if not clean_uid:
        return None

    # 1. ค้นหาจาก line_uid ใน collection 'users'
    try:
        query = db.collection('users').where('line_uid', '==', clean_uid).limit(1).get()
        if query:
            doc = query[0]
            return {'id': doc.id, 'data': doc.to_dict()}
    except Exception:
        pass

    # 2. ค้นหาโดยใช้ Document ID ใน collection 'users'
    try:
        doc_ref = db.collection('users').document(clean_uid).get()
        if doc_ref.exists:
            return {'id': doc_ref.id, 'data': doc_ref.to_dict()}
    except Exception:
        pass

    # 3. ค้นหาจาก array 'used_short_codes'
    try:
        query = db.collection('users').where('used_short_codes', 'array_contains', clean_uid).limit(1).get()
        if query:
            doc = query[0]
            return {'id': doc.id, 'data': doc.to_dict()}
    except Exception:
        pass

    # 4. ค้นหาจาก walkin_temp_short_code
    try:
        query = db.collection('users').where('walkin_temp_short_code', '==', clean_uid).limit(1).get()
        if query:
            doc = query[0]
            return {'id': doc.id, 'data': doc.to_dict()}
    except Exception:
        pass

    # 5. ค้นหาจาก short_code
    try:
        query = db.collection('users').where('short_code', '==', clean_uid).limit(1).get()
        if query:
            doc = query[0]
            return {'id': doc.id, 'data': doc.to_dict()}
    except Exception:
        pass

    # 6. ค้นหาจาก shortCode
    try:
        query = db.collection('users').where('shortCode', '==', clean_uid).limit(1).get()
        if query:
            doc = query[0]
            return {'id': doc.id, 'data': doc.to_dict()}
    except Exception:
        pass

    # 7. ค้นหาจาก studentId
    try:
        query = db.collection('users').where('studentId', '==', clean_uid).limit(1).get()
        if query:
            doc = query[0]
            return {'id': doc.id, 'data': doc.to_dict()}
    except Exception:
        pass

    return None

# --- 4. ฟังก์ชันยืนยันอนุมัติสิทธิ์ Walk-in (Walk-in Approval) ---
def approve_walkin_users(db, walkin_qrs, dry_run=True):
    print("\n" + "=" * 55)
    print("🚀 เริ่มกระบวนการยืนยันการ Walk-in (Walk-in Approval)")
    print("=" * 55)

    approved_count = 0
    already_approved_count = 0
    not_found_count = 0
    total = len(walkin_qrs)

    if total == 0:
        print("ไม่มีรายการ Walk-in ให้ประมวลผล")
        return {
            'approved': 0,
            'already_approved': 0,
            'not_found': 0,
            'total': 0
        }

    for item in walkin_qrs:
        uid = item['uid']
        filename = item['filename']
        student = find_student_in_db(db, uid)

        if not student:
            print(f" 🔴 หาไม่พบใน DB: UID {uid} | ไฟล์: {filename}")
            not_found_count += 1
            continue

        student_id = student['id']
        student_data = student['data']
        first_name = student_data.get('firstName', '')
        last_name = student_data.get('lastName', '')
        std_id_code = student_data.get('studentId', '')
        full_name = f"{first_name} {last_name}".strip() or "ไม่ระบุชื่อ"

        walkin_status = student_data.get('walkin_status', '')
        walkin_verified = student_data.get('walkin_verified', False)

        if walkin_status == 'APPROVED' or walkin_verified is True:
            print(f" 🟡 มี Log อนุมัติแล้ว ไม่ต้องอัพเดตเพิ่ม: {full_name} ({std_id_code}) | ไฟล์: {filename}")
            already_approved_count += 1
            continue

        iso_timestamp = get_thai_iso_string()
        approval_payload = {
            'walkin_status': 'APPROVED',
            'walkin_verified': True,
            'walkin_approved_at': iso_timestamp,
            'walkin_approved_by_staff_name': 'Admin Script CLI',
            'walkin_approved_by_staff_uid': 'ADMIN_SCRIPT',
            'updatedAt': iso_timestamp
        }

        staff_log_payload = {
            'action': 'APPROVE_WALKIN',
            'actor_name': 'Admin Script CLI',
            'actor_uid': 'ADMIN_SCRIPT',
            'actor_username': 'admin_cli',
            'target_name': full_name,
            'target_student_id': std_id_code,
            'target_user_id': student_id,
            'timestamp': iso_timestamp,
            'details': 'อนุมัติผู้สมัคร Walk-in ผ่านระบบสคริปต์อัตโนมัติ (Python CLI)'
        }

        if not dry_run:
            user_ref = db.collection('users').document(student_id)
            user_ref.update(approval_payload)

            log_ref = db.collection('staff_access_logs').document()
            log_ref.set(staff_log_payload)

            print(f" 🟢 [บันทึกจริง] อนุมัติสำเร็จ: {full_name} ({std_id_code}) | ไฟล์: {filename}")
        else:
            print(f" 🟢 [Dry-Run] พร้อมอนุมัติ: {full_name} ({std_id_code}) | ไฟล์: {filename}")

        approved_count += 1

    print("-" * 55)
    print(f"📈 สรุปผลการอนุมัติสิทธิ์ Walk-in")
    print(f" 🟢 อนุมัติใหม่สำเร็จ: {approved_count} คน")
    print(f" 🟡 มี Log อนุมัติอยู่แล้ว: {already_approved_count} คน")
    print(f" 🔴 หาไม่พบใน DB: {not_found_count} คน")
    print(f" 📦 รวมทั้งหมด: {total} คน")
    print("=" * 55)

    return {
        'approved': approved_count,
        'already_approved': already_approved_count,
        'not_found': not_found_count,
        'total': total
    }

# --- 5. ฟังก์ชันอัพเดต Day 1 Morning Check-in ---
def update_day1_morning_checkin(db, normal_qrs, walkin_qrs, dry_run=True):
    print("\n" + "=" * 55)
    print("🌅 เริ่มกระบวนการลงทะเบียน Day 1 Morning Check-in")
    print("=" * 55)

    all_qrs = normal_qrs + walkin_qrs
    success_count = 0
    already_checked_in_count = 0
    not_found_count = 0
    total_qrs = len(all_qrs)

    if total_qrs == 0:
        print("ไม่มีรายการ QR Code ให้ประมวลผลเช็คอิน")
        return {
            'success': 0,
            'already_checked_in': 0,
            'not_found': 0,
            'total': 0
        }

    for item in all_qrs:
        uid = item['uid']
        filename = item['filename']
        student = find_student_in_db(db, uid)

        if not student:
            print(f" 🔴 หาผู้ใช้ไม่พบใน DB: UID {uid} | ไฟล์: {filename}")
            not_found_count += 1
            continue

        student_id = student['id']
        student_data = student['data']
        first_name = student_data.get('firstName', '')
        last_name = student_data.get('lastName', '')
        std_id_code = student_data.get('studentId', '')
        full_name = f"{first_name} {last_name}".strip() or "ไม่ระบุชื่อ"

        # ตรวจสอบว่ามี log การเช็คอิน Day 1 morning อยู่แล้วหรือไม่
        if student_data.get('checkin_day1_morning'):
            print(f" 🟡 มี Log แล้ว ไม่ต้องบันทึกเพิ่ม: {full_name} ({std_id_code}) | ไฟล์: {filename}")
            already_checked_in_count += 1
            continue

        iso_timestamp = get_thai_iso_string()
        user_update_payload = {
            'checkin_day1_morning': iso_timestamp,
            'checkin_day1_morning_by': 'Admin Script CLI',
            'checkin_day1_morning_by_staff_uid': 'ADMIN_SCRIPT',
            'checkin_day1_morning_by_staff_pic': '',
            'checkin_day1_morning_by_staff_username': 'admin_cli',
            'checkin_day1_morning_operator_user': 'admin_cli',
            'checkin_day1_morning_search_method': 'QR_CODE',
            'checkin_day1_morning_ip': '127.0.0.1',
            'checkin_day1_morning_device_model': 'Python OpenCV Script',
            'checkin_day1_morning_user_agent': 'Python-zxingcpp',
            'checkin_day1_morning_platform': 'macOS Python',
            'updatedAt': iso_timestamp
        }

        short_code_val = student_data.get('short_code') or student_data.get('walkin_temp_short_code') or ''

        log_payload = {
            'checkin_by_staff_name': 'Admin Script CLI',
            'checkin_by_staff_uid': 'ADMIN_SCRIPT',
            'checkin_by_staff_username': 'admin_cli',
            'checkin_type': 'DAY1_MORNING',
            'device_model': 'Python OpenCV Script',
            'department': student_data.get('department', ''),
            'firstName': first_name,
            'lastName': last_name,
            'studentId': std_id_code,
            'short_code': short_code_val,
            'ip': '127.0.0.1',
            'operator_user': 'admin_cli',
            'platform': 'macOS Python',
            'search_method': 'QR_CODE',
            'timestamp': iso_timestamp,
            'user_agent': 'Python-zxingcpp',
            'user_doc_id': student_id
        }

        if not dry_run:
            user_ref = db.collection('users').document(student_id)
            user_ref.update(user_update_payload)

            log_ref = db.collection('registration_checkin_logs').document()
            log_ref.set(log_payload)

            print(f" 🟢 [บันทึกจริง] บันทึกเช็คอิน Day 1 เช้าสำเร็จ: {full_name} ({std_id_code}) | ไฟล์: {filename}")
        else:
            print(f" 🟢 [Dry-Run] พร้อมบันทึกเช็คอิน Day 1 เช้า: {full_name} ({std_id_code}) | ไฟล์: {filename}")

        success_count += 1

    print("-" * 55)
    print(f"📈 สรุปผลการอัพเดต Day 1 Morning Check-in")
    print(f" 🟢 1. ลงทะเบียนใหม่สำเร็จ: {success_count} คน")
    print(f" 🟡 2. มี Log อยู่แล้ว (ไม่ต้องบันทึกเพิ่ม): {already_checked_in_count} คน")
    print(f" 🔴 3. หาผู้ใช้ไม่พบใน DB: {not_found_count} คน")
    print(f" --------------------------------------------------")
    print(f" 📦 รวมประมวลผลทั้งหมด: {total_qrs} / {total_qrs} คน")
    
    is_100_percent = (success_count + already_checked_in_count == total_qrs) and (total_qrs > 0)
    if is_100_percent:
        print(f" ✅ ตรวจสอบความถูกต้อง: รวมครบถ้วนทุกไฟล์ที่อ่านได้ทั้งหมด (100%)")
    else:
        print(f" ⚠️ มีบางไฟล์ที่หาใน DB ไม่พบ ({not_found_count} คน)")

    print("=" * 55)

    return {
        'success': success_count,
        'already_checked_in': already_checked_in_count,
        'not_found': not_found_count,
        'total': total_qrs,
        'is_100_percent': is_100_percent
    }

# --- 6. ส่วนการทำงานหลัก (Main Execution) ---
if __name__ == '__main__':
    KEY_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json'
    TARGET_FOLDER = '../../Bloom'

    print("🔍 ตรวจสอบพาธโฟลเดอร์ภาพ:", os.path.abspath(TARGET_FOLDER))
    
    if not os.path.exists(TARGET_FOLDER):
        print(f"❌ ไม่พบโฟลเดอร์ภาพที่: {os.path.abspath(TARGET_FOLDER)}")
    else:
        normal_data, walkin_data, unread_data = process_qr_codes(TARGET_FOLDER)

        if not os.path.exists(KEY_PATH):
            print(f"❌ ไม่พบไฟล์ Firebase Key ที่: {KEY_PATH}")
        else:
            if not firebase_admin._apps:
                cred = credentials.Certificate(KEY_PATH)
                firebase_admin.initialize_app(cred)
            
            db = firestore.client()

            DRY_RUN = False # กำหนด True เพื่อทดสอบอย่างเดียว หรือ False เพื่ออัพเดตลง Firestore จริง

            # -------------------------------------------------------------
            # STEP 1: อนุมัติสิทธิ์ Walk-in ก่อน (Walk-in Approval FIRST)
            # -------------------------------------------------------------
            walkin_summary = approve_walkin_users(db, walkin_data, dry_run=DRY_RUN)

            # -------------------------------------------------------------
            # STEP 2: บันทึกลงทะเบียน Day 1 Morning Check-in (SECOND)
            # -------------------------------------------------------------
            checkin_summary = update_day1_morning_checkin(db, normal_data, walkin_data, dry_run=DRY_RUN)

            # -------------------------------------------------------------
            # STEP 3: พิมพ์รายงานสรุปภาพรวมทั้งหมด (Grand Summary Report)
            # -------------------------------------------------------------
            total_read_success = len(normal_data) + len(walkin_data)
            
            print("\n🏆=====================================================")
            print("📋 สรุปรายงานภาพรวมการประมวลผลทั้งหมด Day 1 (Grand Summary Report)")
            print("==================================================")
            print(f"📁 จำนวนไฟล์รูปภาพ QR ที่อ่านสำเร็จ: {total_read_success} ไฟล์")
            print(f"  • ทั่วไป (Normal): {len(normal_data)} ไฟล์")
            print(f"  • Walk-in: {len(walkin_data)} ไฟล์")
            print("--------------------------------------------------")
            print("🚶 1. การอนุมัติสิทธิ์ Walk-in:")
            print(f"  • อนุมัติใหม่สำเร็จ: {walkin_summary['approved']} คน")
            print(f"  • มี Log อนุมัติอยู่แล้ว: {walkin_summary['already_approved']} คน")
            print("--------------------------------------------------")
            print("🌅 2. การลงทะเบียน Day 1 Morning Check-in:")
            print(f"  • บันทึกใหม่สำเร็จ: {checkin_summary['success']} คน")
            print(f"  • มี Log ลงทะเบียนอยู่แล้ว: {checkin_summary['already_checked_in']} คน")
            print("--------------------------------------------------")
            if checkin_summary['is_100_percent']:
                print("✅ สถานะภาพรวม: การประมวลผลสมบูรณ์ 100% ครบถ้วนทุกไฟล์!")
            else:
                print(f"⚠️ สถานะภาพรวม: ประมวลผลได้ {checkin_summary['success'] + checkin_summary['already_checked_in']} / {total_read_success} คน")
            print("=======================================================\n")
