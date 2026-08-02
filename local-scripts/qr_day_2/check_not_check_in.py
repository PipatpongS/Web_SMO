import os
import csv
import firebase_admin
from firebase_admin import credentials, firestore

# --- 1. กำหนดตำแหน่งไฟล์ Firebase Admin SDK Key และไฟล์ CSV ปลายทาง ---
KEY_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json'
CSV_FULL_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/qr_day_2/not_checked_in_students.csv'
CSV_UID_ONLY_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/qr_day_2/line_uids_not_checked_in.csv'

def main():
    print("=" * 70)
    print("📊 รายงานสรุปจำนวนผู้ที่ยังไม่ได้เช็คอิน Day 1 และ Day 2 เช้า พร้อมส่งออก CSV")
    print("=" * 70)

    if not os.path.exists(KEY_PATH):
        print(f"❌ ไม่พบไฟล์ Firebase Key ที่: {KEY_PATH}")
        return

    if not firebase_admin._apps:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    print("🔍 กำลังดึงข้อมูลผู้ใช้งานทั้งหมดจาก Firestore...")
    users_ref = db.collection('users').get()
    total_users = len(users_ref)

    if total_users == 0:
        print("⚠️ ไม่พบข้อมูลผู้ใช้ในระบบ")
        return

    # ตัวแปรเก็บสถิติต่างๆ
    count_day1_checked = 0
    count_day1_not_checked = 0

    count_day2_checked = 0
    count_day2_not_checked = 0

    count_not_checked_both = 0     # ไม่ได้เช็คอินทั้ง Day 1 และ Day 2 (ทั้ง 2 วัน)
    count_not_checked_any = 0      # ไม่ได้เช็คอินอย่างน้อย 1 วัน (รวมแบบไม่ซ้ำ Day 1-2)
    count_checked_both = 0         # เช็คอินครบทั้ง 2 วัน

    dept_stats = {}
    not_checked_any_list = []
    unique_line_uids = set()

    for doc in users_ref:
        d = doc.to_dict()
        doc_id = doc.id
        line_uid = d.get('line_uid', doc_id if doc_id.startswith('U') else '')
        std_id = d.get('studentId', '')
        fname = d.get('firstName', '')
        lname = d.get('lastName', '')
        dept = d.get('department', 'ไม่ระบุภาควิชา') or 'ไม่ระบุภาควิชา'
        full_name = f"{fname} {lname}".strip() or "ไม่ระบุชื่อ"

        has_day1 = bool(d.get('checkin_day1_morning'))
        has_day2 = bool(d.get('checkin_day2_morning'))

        if dept not in dept_stats:
            dept_stats[dept] = {
                'total': 0,
                'day1_not_checked': 0,
                'day2_not_checked': 0,
                'both_not_checked': 0,
                'any_not_checked': 0,
                'both_checked': 0
            }

        dept_stats[dept]['total'] += 1

        # เช็ค Day 1
        if has_day1:
            count_day1_checked += 1
        else:
            count_day1_not_checked += 1
            dept_stats[dept]['day1_not_checked'] += 1

        # เช็ค Day 2
        if has_day2:
            count_day2_checked += 1
        else:
            count_day2_not_checked += 1
            dept_stats[dept]['day2_not_checked'] += 1

        # เช็คกรณีไม่ได้เช็คทั้ง 2 วัน
        if not has_day1 and not has_day2:
            count_not_checked_both += 1
            dept_stats[dept]['both_not_checked'] += 1

        # เช็คกรณีไม่ได้เช็คอย่างน้อย 1 วัน (รวมแบบไม่ซ้ำ Day 1 หรือ Day 2)
        if not has_day1 or not has_day2:
            count_not_checked_any += 1
            dept_stats[dept]['any_not_checked'] += 1

            if line_uid:
                unique_line_uids.add(line_uid)

            if not has_day1 and not has_day2:
                missing_status = 'MISSING_BOTH'
                missing_desc = 'ไม่ได้เช็คอินทั้ง 2 วัน'
            elif not has_day1:
                missing_status = 'MISSING_DAY1'
                missing_desc = 'ไม่ได้เช็คอิน Day 1 เช้า'
            else:
                missing_status = 'MISSING_DAY2'
                missing_desc = 'ไม่ได้เช็คอิน Day 2 เช้า'

            not_checked_any_list.append({
                'doc_id': doc_id,
                'line_uid': line_uid,
                'studentId': std_id,
                'firstName': fname,
                'lastName': lname,
                'fullName': full_name,
                'department': dept,
                'day1_morning_status': 'CHECKED_IN' if has_day1 else 'NOT_CHECKED_IN',
                'day2_morning_status': 'CHECKED_IN' if has_day2 else 'NOT_CHECKED_IN',
                'missing_status': missing_status,
                'missing_desc': missing_desc
            })

        # เช็คกรณีเช็คอินครบทั้ง 2 วัน
        if has_day1 and has_day2:
            count_checked_both += 1
            dept_stats[dept]['both_checked'] += 1

    # -------------------------------------------------------------
    # 2. บันทึกไฟล์ CSV เฉพาะ LINE UID (line_uids_not_checked_in.csv)
    # -------------------------------------------------------------
    sorted_uids = sorted(list(unique_line_uids))
    with open(CSV_UID_ONLY_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['line_uid'])
        for uid in sorted_uids:
            writer.writerow([uid])

    print(f"\n💾 1. บันทึกไฟล์ CSV เฉพาะ LINE UID เรียบร้อยที่: {CSV_UID_ONLY_PATH}")
    print(f"   (รวมทั้งหมด {len(sorted_uids)} UID ไม่นับซ้ำ)")

    # -------------------------------------------------------------
    # 3. บันทึกไฟล์ CSV ข้อมูลฉบับเต็ม (not_checked_in_students.csv)
    # -------------------------------------------------------------
    fieldnames = [
        'doc_id',
        'line_uid',
        'studentId',
        'firstName',
        'lastName',
        'fullName',
        'department',
        'day1_morning_status',
        'day2_morning_status',
        'missing_status',
        'missing_desc'
    ]

    with open(CSV_FULL_PATH, mode='w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in not_checked_any_list:
            writer.writerow(row)

    print(f"💾 2. บันทึกไฟล์ CSV ข้อมูลฉบับเต็มเรียบร้อยที่: {CSV_FULL_PATH}")

    # -------------------------------------------------------------
    # 4. รายงานสรุปภาพรวม (Grand Summary Report)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("📈 รายงานสรุปภาพรวมจำนวนผู้เช็คอิน / ไม่ได้เช็คอิน (Grand Summary Report)")
    print("=" * 70)
    print(f"👥 ผู้ใช้งานทั้งหมดในระบบ: {total_users:,} คน")
    print("-" * 70)
    print(f"🌅 1. เช็คอิน Day 1 Morning:")
    print(f"   • เช็คอินแล้ว:      {count_day1_checked:,} คน ({(count_day1_checked/total_users)*100:.1f}%)")
    print(f"   ❌ ยังไม่ได้เช็คอิน:   {count_day1_not_checked:,} คน ({(count_day1_not_checked/total_users)*100:.1f}%)")
    print("-" * 70)
    print(f"🌅 2. เช็คอิน Day 2 Morning:")
    print(f"   • เช็คอินแล้ว:      {count_day2_checked:,} คน ({(count_day2_checked/total_users)*100:.1f}%)")
    print(f"   ❌ ยังไม่ได้เช็คอิน:   {count_day2_not_checked:,} คน ({(count_day2_not_checked/total_users)*100:.1f}%)")
    print("-" * 70)
    print(f"🔴 3. สรุปผู้ที่ยังไม่ได้เช็คอิน (และส่งออกไฟล์ CSV):")
    print(f"   • ไม่ได้เช็คอินทั้ง 2 วัน (ทั้ง Day 1 และ Day 2): {count_not_checked_both:,} คน ({(count_not_checked_both/total_users)*100:.1f}%)")
    print(f"   ⚡ ไม่ได้เช็คอินอย่างน้อย 1 วัน (รวมแบบไม่ซ้ำ Day 1-2): {count_not_checked_any:,} คน ({(count_not_checked_any/total_users)*100:.1f}%)")
    print("-" * 70)
    print(f"🎉 4. ผู้ที่เช็คอินครบสมบูรณ์ทั้ง 2 วัน: {count_checked_both:,} คน ({(count_checked_both/total_users)*100:.1f}%)")
    print("=" * 70)

    # -------------------------------------------------------------
    # 5. รายงานแยกตามภาควิชา (Department Breakdown)
    # -------------------------------------------------------------
    print("\n🏢 รายงานสรุปแยกตามภาควิชา (Department Breakdown):")
    print("-" * 70)
    print(f"{'ภาควิชา':<35} | {'ทั้งหมด':<7} | {'ขาด Day1':<8} | {'ขาด Day2':<8} | {'ขาดไม่ซ้ำ':<8}")
    print("-" * 70)

    sorted_depts = sorted(dept_stats.items(), key=lambda x: x[0])
    for dept_name, stats in sorted_depts:
        print(f"{dept_name:<35} | {stats['total']:<7} | {stats['day1_not_checked']:<8} | {stats['day2_not_checked']:<8} | {stats['any_not_checked']:<8}")

    print("-" * 70)
    print("=" * 70 + "\n")

if __name__ == '__main__':
    main()
