import os
import cv2
import zxingcpp
from datetime import datetime, timezone, timedelta
import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. ฟังก์ชันช่วยสร้าง เวลามาตรฐานประเทศไทย (ISO 8601) ---
def get_thai_iso_string():
    tz_thai = timezone(timedelta(hours=7))
    now_thai = datetime.now(tz_thai)
    return now_thai.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + '+07:00'

# --- 2. ฟังก์ชันสแกนอ่าน QR Code จากภาพ ---
def process_qr_codes(folder_path):
    normal_qrs = []   # เก็บข้อมูล QR บุคคลทั่วไป (UID_LINE)
    walkin_qrs = []   # เก็บข้อมูล QR ประเภท Walk-in
    failed_files = [] # เก็บชื่อไฟล์ที่อ่านไม่ได้

    valid_extensions = ('.jpg', '.jpeg', '.png')
    image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(valid_extensions)]
    total_files = len(image_files)

    if total_files == 0:
        print("ไม่พบไฟล์รูปภาพในโฟลเดอร์ที่ระบุ")
        return [], [], []

    for filename in image_files:
        filepath = os.path.join(folder_path, filename)
        img = cv2.imread(filepath)
        
        if img is None:
            failed_files.append(filename)
            continue

        results = zxingcpp.read_barcodes(img)
        if results:
            qr_data = results[0].text.strip()
            
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
    print(f"📊 สรุปผลการสแกน QR Code จากภาพ")
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

    # 3. ค้นหาใน used_short_codes
    try:
        sc_doc = db.collection('used_short_codes').document(clean_uid).get()
        if sc_doc.exists and sc_doc.to_dict().get('uid'):
            target_uid = sc_doc.to_dict().get('uid')
            u_doc = db.collection('users').document(target_uid).get()
            if u_doc.exists:
                return {'id': u_doc.id, 'data': u_doc.to_dict()}
    except Exception:
        pass

    # 4. ค้นหาจาก walkin_temp_short_code / short_code / shortCode / studentId
    for field_name in ['walkin_temp_short_code', 'short_code', 'shortCode', 'studentId']:
        try:
            q = db.collection('users').where(field_name, '==', clean_uid).limit(1).get()
            if q:
                doc = q[0]
                return {'id': doc.id, 'data': doc.to_dict()}
        except Exception:
            pass

    return None

# --- 4. ฟังก์ชันอนุมัติสิทธิ์ Walk-in (Walk-in Approval - ต้องทำก่อน Day 2 Check-in) ---
def approve_walkin_users(db, walkin_qrs, dry_run=False):
    total_walkins = len(walkin_qrs)
    if total_walkins == 0:
        print("\n🚶 ไม่พบรายการ Walk-in ที่ต้องอนุมัติ")
        return {
            'newly_approved': [],
            'already_approved': [],
            'not_found': [],
            'is_complete': True
        }

    print("\n" + "=" * 55)
    print(f"STEP 1: 🚶 กระบวนการอนุมัติสิทธิ์ Walk-in (Walk-in Approval)")
    print(f"จำนวน Walk-in ที่ต้องประมวลผล: {total_walkins} คน")
    print(f"สถานะการบันทึก (Dry Run): {'เปิด (ทดสอบอย่างเดียว)' if dry_run else 'ปิด (บันทึกข้อมูลจริง)'}")
    print("=" * 55)

    already_approved = []
    newly_approved = []
    not_found = []

    for item in walkin_qrs:
        filename = item['filename']
        uid = item['uid']
        student = find_student_in_db(db, uid)

        if not student:
            not_found.append({'filename': filename, 'uid': uid})
            print(f"  ❌ ไม่พบข้อมูล Walk-in ใน DB: {filename} (UID: {uid})")
            continue

        doc_id = student['id']
        data = student['data']
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        student_name = f"{first_name} {last_name}".strip() or 'N/A'
        std_id = data.get('studentId') or doc_id

        # ตรวจสอบว่ามีการอนุมัติ Walk-in อยู่แล้วหรือไม่
        is_approved = (
            data.get('walkin_status') == 'APPROVED' or
            data.get('walkin_verified') is True or
            bool(data.get('walkin_approved_at'))
        )

        if is_approved:
            already_approved.append({
                'filename': filename,
                'uid': uid,
                'name': student_name,
                'student_id': std_id,
                'doc_id': doc_id,
                'approved_at': data.get('walkin_approved_at')
            })
            print(f"  🟡 มี Log ยืนยันแล้ว ไม่ต้องทำเพิ่ม: {student_name} ({std_id}) | ไฟล์: {filename}")
        else:
            timestamp = get_thai_iso_string()
            update_payload = {
                'walkin_status': 'APPROVED',
                'walkin_verified': True,
                'walkin_approved_at': timestamp,
                'walkin_approved_by_staff_name': 'Admin Script CLI',
                'walkin_approved_by_staff_uid': 'ADMIN_SCRIPT',
                'updatedAt': timestamp
            }

            if not dry_run:
                # อัพเดตสถานะใน users collection ให้หน้าเว็บฝั่งผู้ใช้เปลี่ยนสถานะเป็น APPROVED
                db.collection('users').document(doc_id).update(update_payload)

                # บันทึก Audit Log ใน staff_access_logs
                try:
                    db.collection('staff_access_logs').add({
                        'timestamp': timestamp,
                        'event': 'WALKIN_APPROVED_VIA_SCRIPT',
                        'student_doc_id': doc_id,
                        'student_id': std_id,
                        'student_name': student_name,
                        'staff_line_uid': 'ADMIN_SCRIPT',
                        'staff_name': 'Admin Script CLI',
                        'search_code': uid
                    })
                except Exception:
                    pass

            newly_approved.append({
                'filename': filename,
                'uid': uid,
                'name': student_name,
                'student_id': std_id,
                'doc_id': doc_id
            })
            print(f"  🟢 ยืนยัน Walk-in สำเร็จ (หน้าเว็บเปลี่ยนสถานะเรียบร้อย): {student_name} ({std_id}) | ไฟล์: {filename}")

    # สรุปผลการอนุมัติ Walk-in
    total_processed = len(newly_approved) + len(already_approved) + len(not_found)
    is_complete = (total_processed == total_walkins)

    print("\n" + "=" * 55)
    print(f"📊 สรุปผลการอนุมัติสิทธิ์ Walk-in (Walk-in Approval Summary)")
    print(f"==================================================")
    print(f"🚶 จำนวน Walk-in ทั้งหมด: {total_walkins} คน")
    print(f"🟢 1. ยืนยันสำเร็จ (บันทึกใหม่): {len(newly_approved)} คน")
    print(f"🟡 2. มี Log ยืนยันไปแล้ว (ไม่ต้องทำเพิ่ม): {len(already_approved)} คน")
    print(f"🔴 3. หาผู้ใช้ไม่พบใน DB: {len(not_found)} คน")
    print(f"--------------------------------------------------")
    print(f"📦 รวมประมวลผล Walk-in ทั้งหมด: {total_processed} / {total_walkins} คน")
    
    if is_complete:
        print(f"✅ ตรวจสอบความถูกต้อง Walk-in: ครบถ้วนทุกไฟล์ (100%)")
    else:
        print(f"⚠️ ตรวจสอบความถูกต้อง Walk-in: ผลรวมไม่ตรงกัน")
    print("=" * 55)

    return {
        'newly_approved': newly_approved,
        'already_approved': already_approved,
        'not_found': not_found,
        'is_complete': is_complete
    }

# --- 5. ฟังก์ชันอัพเดต Day 2 Morning Check-in ลง Firestore ---
def update_day2_morning_checkin(db, normal_qrs, walkin_qrs, dry_run=False):
    all_read_items = normal_qrs + walkin_qrs
    total_read_files = len(all_read_items)

    if total_read_files == 0:
        print("\n⚠️ ไม่มีข้อมูล QR ที่อ่านได้สำหรับนำไปอัพเดต Check-in")
        return {
            'newly_checked_in': [],
            'already_checked_in': [],
            'not_found': [],
            'is_complete': True
        }

    print("\n" + "=" * 55)
    print(f"STEP 2: 🚀 กระบวนการอัพเดต Day 2 Morning Check-in")
    print(f"จำนวนไฟล์ที่ต้องประมวลผล: {total_read_files} คน")
    print(f"สถานะการบันทึก (Dry Run): {'เปิด (ทดสอบอย่างเดียว)' if dry_run else 'ปิด (บันทึกข้อมูลจริง)'}")
    print("=" * 55)

    already_checked_in = [] # รายชื่อผู้ที่มี log check-in อยู่แล้ว
    newly_checked_in = []   # รายชื่อผู้ที่อัพเดตลงทะเบียนสำเร็จใหม่
    not_found_users = []    # รายชื่อที่ไม่พบในฐานข้อมูล

    for item in all_read_items:
        filename = item['filename']
        uid = item['uid']
        
        student = find_student_in_db(db, uid)
        
        if not student:
            not_found_users.append({'filename': filename, 'uid': uid})
            print(f"  ❌ ไม่พบข้อมูลใน DB: {filename} (UID: {uid})")
            continue

        doc_id = student['id']
        data = student['data']
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        student_name = f"{first_name} {last_name}".strip() or 'N/A'
        std_id = data.get('studentId') or doc_id

        # หากเป็น Walk-in และยังไม่ได้ยืนยัน ให้สคริปต์ช่วยยืนยันเพิ่มความชัวร์
        if item.get('is_walkin') and not (data.get('walkin_status') == 'APPROVED' or data.get('walkin_verified')):
            if not dry_run:
                timestamp_approve = get_thai_iso_string()
                db.collection('users').document(doc_id).update({
                    'walkin_status': 'APPROVED',
                    'walkin_verified': True,
                    'walkin_approved_at': timestamp_approve,
                    'walkin_approved_by_staff_name': 'Admin Script CLI',
                    'walkin_approved_by_staff_uid': 'ADMIN_SCRIPT',
                    'updatedAt': timestamp_approve
                })

        # ตรวจสอบว่ามี Log การเช็คอิน Day 2 Morning อยู่แล้วหรือไม่
        if data.get('checkin_day2_morning'):
            already_checked_in.append({
                'filename': filename,
                'uid': uid,
                'name': student_name,
                'student_id': std_id,
                'doc_id': doc_id,
                'existing_checkin': data.get('checkin_day2_morning')
            })
            print(f"  🟡 มี Log แล้ว ไม่ต้องบันทึกเพิ่ม: {student_name} ({std_id}) | ไฟล์: {filename}")
        else:
            timestamp = get_thai_iso_string()
            update_payload = {
                'checkin_day2_morning': timestamp,
                'checkin_day2_morning_by': 'Admin Script CLI',
                'checkin_day2_morning_by_staff_uid': 'ADMIN_SCRIPT',
                'checkin_day2_morning_by_staff_pic': '',
                'checkin_day2_morning_by_staff_username': 'admin_cli',
                'checkin_day2_morning_operator_user': 'admin_cli',
                'checkin_day2_morning_search_method': 'QR_CODE',
                'checkin_day2_morning_ip': '127.0.0.1',
                'checkin_day2_morning_device_model': 'Python OpenCV Script',
                'checkin_day2_morning_user_agent': 'Python-zxingcpp',
                'checkin_day2_morning_platform': 'macOS Python',
                'updatedAt': timestamp
            }

            if not dry_run:
                # 1. Update Document ใน users collection
                user_ref = db.collection('users').document(doc_id)
                user_ref.update(update_payload)

                # 2. บันทึก Audit Log ใน registration_checkin_logs collection
                log_ref = db.collection('registration_checkin_logs').document()
                log_ref.set({
                    'log_id': log_ref.id,
                    'session': 'day2_morning',
                    'action': 'CHECKIN_REGISTRATION_DAY2',
                    'timestamp': timestamp,
                    'student_doc_id': doc_id,
                    'student_line_uid': data.get('line_uid', doc_id),
                    'student_id': data.get('studentId') or data.get('id') or '',
                    'student_short_code': data.get('short_code') or data.get('walkin_temp_short_code') or data.get('shortCode') or '',
                    'student_group': data.get('group') or data.get('assigned_group') or data.get('assigned_group_name') or '',
                    'student_name': student_name,
                    'department': data.get('department') or '',
                    'search_method': 'QR_CODE',
                    'staff_line_uid': 'ADMIN_SCRIPT',
                    'staff_username': 'admin_cli',
                    'staff_display_name': 'Admin Script CLI',
                    'operator_username': 'admin_cli'
                })

            newly_checked_in.append({
                'filename': filename,
                'uid': uid,
                'name': student_name,
                'student_id': std_id,
                'doc_id': doc_id
            })
            print(f"  🟢 ลงทะเบียนสำเร็จ (บันทึกใหม่): {student_name} ({std_id}) | ไฟล์: {filename}")

    # สรุปผลรวม Day 2 Check-in
    total_processed = len(newly_checked_in) + len(already_checked_in) + len(not_found_users)
    is_complete = (total_processed == total_read_files)

    print("\n" + "=" * 55)
    print(f"📈 สรุปผลการอัพเดต Day 2 Morning Check-in")
    print(f"==================================================")
    print(f"🟢 1. ลงทะเบียนใหม่สำเร็จ: {len(newly_checked_in)} คน")
    print(f"🟡 2. มี Log อยู่แล้ว (ไม่ต้องบันทึกเพิ่ม): {len(already_checked_in)} คน")
    print(f"🔴 3. หาผู้ใช้ไม่พบใน DB: {len(not_found_users)} คน")
    print(f"--------------------------------------------------")
    print(f"📦 รวมประมวลผลทั้งหมด: {total_processed} / {total_read_files} คน")
    
    if is_complete:
        print(f"✅ ตรวจสอบความถูกต้อง: รวมครบถ้วนทุกไฟล์ที่อ่านได้ทั้งหมด (100%)")
    else:
        print(f"⚠️ ตรวจสอบความถูกต้อง: ผลรวมไม่ตรงกัน ({total_processed} vs {total_read_files})")
    print("=" * 55)

    return {
        'newly_checked_in': newly_checked_in,
        'already_checked_in': already_checked_in,
        'not_found': not_found_users,
        'is_complete': is_complete
    }

# --- วิธีใช้งาน ---
TARGET_FOLDER = "../TME" 

if not os.path.exists(TARGET_FOLDER):
    print(f"กรุณาสร้างโฟลเดอร์ {TARGET_FOLDER} และนำรูปภาพไปใส่ไว้")
else:
    # 1. อ่านไฟล์รูปภาพ QR ทั้งหมด
    normal_data, walkin_data, unread_data = process_qr_codes(TARGET_FOLDER)
    
    if normal_data or walkin_data:
        # 2. เชื่อมต่อ Firebase Firestore
        key_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json'))
        if not os.path.exists(key_path):
            key_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json'))
        
        if not os.path.exists(key_path):
            print(f"❌ ไม่พบไฟล์ Service Account Key ที่: {key_path}")
        else:
            if not firebase_admin._apps:
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
            
            db = firestore.client()

            DRY_RUN = False # กำหนด True เพื่อทดสอบอย่างเดียว หรือ False เพื่ออัพเดตลง Firestore จริง

            # -------------------------------------------------------------
            # STEP 1: อนุมัติสิทธิ์ Walk-in ก่อน (Walk-in Approval FIRST)
            # -------------------------------------------------------------
            walkin_result = approve_walkin_users(db, walkin_data, dry_run=DRY_RUN)

            # -------------------------------------------------------------
            # STEP 2: บันทึก Day 2 Morning Check-in ตามหลัง (Day 2 Check-in NEXT)
            # -------------------------------------------------------------
            checkin_result = update_day2_morning_checkin(db, normal_data, walkin_data, dry_run=DRY_RUN)

            # -------------------------------------------------------------
            # OVERALL GRAND SUMMARY: สรุปผลภาพรวมทั้งหมด
            # -------------------------------------------------------------
            total_read_qrs = len(normal_data) + len(walkin_data)
            print("\n" + "🏆" + "=" * 53)
            print(f"📋 สรุปรายงานภาพรวมการประมวลผลทั้งหมด (Grand Summary Report)")
            print(f"==================================================")
            print(f"📁 จำนวนไฟล์รูปภาพ QR ที่อ่านสำเร็จ: {total_read_qrs} ไฟล์")
            print(f"  • ทั่วไป (Normal): {len(normal_data)} ไฟล์")
            print(f"  • Walk-in: {len(walkin_data)} ไฟล์")
            print(f"--------------------------------------------------")
            print(f"🚶 1. การอนุมัติสิทธิ์ Walk-in:")
            print(f"  • อนุมัติใหม่สำเร็จ: {len(walkin_result['newly_approved'])} คน")
            print(f"  • มี Log อนุมัติอยู่แล้ว: {len(walkin_result['already_approved'])} คน")
            print(f"--------------------------------------------------")
            print(f"🌅 2. การลงทะเบียน Day 2 Morning Check-in:")
            print(f"  • บันทึกใหม่สำเร็จ: {len(checkin_result['newly_checked_in'])} คน")
            print(f"  • มี Log ลงทะเบียนอยู่แล้ว: {len(checkin_result['already_checked_in'])} คน")
            print(f"--------------------------------------------------")
            if checkin_result['is_complete'] and walkin_result['is_complete']:
                print(f"✅ สถานะภาพรวม: การประมวลผลสมบูรณ์ 100% ครบถ้วนทุกไฟล์!")
            else:
                print(f"⚠️ สถานะภาพรวม: การประมวลผลบางรายการไม่สมบูรณ์ โปรดตรวจสอบรายละเอียดด้านบน")
            print("=" * 55)