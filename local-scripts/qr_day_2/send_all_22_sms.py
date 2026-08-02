import os
import csv
import time
import subprocess
import urllib.parse
import firebase_admin
from firebase_admin import credentials, firestore

KEY_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json'
CSV_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/qr_day_2/remaining_21_not_sent.csv'
STUDENT_PROFILE_URL = 'https://liff.line.me/2010390110-fPHy5j81/profile'

def main():
    print("=" * 80)
    print("📱 ระบบเปิดส่ง SMS บน Mac สำหรับนิสิต 22 คนที่ไม่ได้รับข้อความ")
    print("=" * 80)

    if not firebase_admin._apps:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    uids = []
    with open(CSV_PATH, encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader, None)
        for r in reader:
            if r and r[0].strip():
                uids.append(r[0].strip())

    print(f"📁 อ่านรายชื่อ UIDs ได้ทั้งหมด {len(uids)} คน\n")

    for idx, uid in enumerate(uids, 1):
        doc = db.collection('users').document(uid).get()
        if not doc.exists:
            continue

        data = doc.to_dict()
        student_id = data.get('studentId', '')
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        student_name = f"{first_name} {last_name}".strip()
        phone = data.get('phoneNumber', '') or data.get('phone', '') or data.get('tel', '')

        clean_phone = phone.strip().replace('-', '').replace(' ', '')
        if clean_phone.startswith('0'):
            clean_phone = '+66' + clean_phone[1:]

        msg = f"📢 แจ้งเตือนสโมสรวิศวะ มจธ.: คุณ {student_name} โปรดตรวจสอบสถานะเช็คชื่อปฐมนิเทศได้ที่: {STUDENT_PROFILE_URL}"
        encoded_msg = urllib.parse.quote(msg)

        print(f"[{idx:2d}/{len(uids)}] 📱 กำลังเตรียมส่ง SMS ถึงคุณ {student_name} ({phone})...")
        
        url = f"sms:{clean_phone}&body={encoded_msg}"
        subprocess.run(['open', url])

        # พยายามกดส่งผ่าน AppleScript
        time.sleep(1.0)
        applescript = '''
        tell application "Messages" to activate
        delay 0.3
        tell application "System Events"
            key code 36
        end tell
        '''
        subprocess.run(['osascript', '-e', applescript], capture_output=True)
        time.sleep(1.5)

    print("\n" + "=" * 80)
    print("✅ เตรียมข้อความ SMS สำหรับนิสิตทั้ง 22 คนบนแอป Messages เรียบร้อยแล้ว")
    print("=" * 80)

if __name__ == '__main__':
    main()
