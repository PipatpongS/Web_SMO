import os
import csv
import smtplib
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import firebase_admin
from firebase_admin import credentials, firestore

# ==============================================================================
# ⚙️ การตั้งค่าการส่งข้อความ (CONFIGURATION)
# ==============================================================================

# 1. การตั้งค่า Email (Gmail SMTP):
GMAIL_SENDER = 'bangmodsmovidva@gmail.com'
GMAIL_APP_PASSWORD = 'xvzk xqfg qlay xwcf' 

# 2. พาธไฟล์ Key และรายชื่อผู้ที่ยังไม่ได้ส่ง 22 คน:
KEY_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json'
CSV_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/qr_day_2/remaining_21_not_sent.csv'

# 3. ลิงก์ปลายทางสำหรับปุ่มในอีเมล:
STUDENT_PROFILE_URL = 'https://liff.line.me/2010390110-fPHy5j81/profile'
LINE_OA_CHAT_URL = 'https://line.me/R/ti/p/@122ddost'

# ==============================================================================
# ✉️ 1. ฟังก์ชันสร้างและส่งอีเมล (HTML Email Notification)
# ==============================================================================
def send_email(to_email, student_name, student_id):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = '📢 แจ้งเตือน: กรุณาตรวจสอบสถานะการเข้ากิจกรรมปฐมนิเทศ (Day 1 - Day 2)'
    msg['From'] = f"สโมสรนักศึกษาคณะวิศวกรรมศาสตร์ มจธ. <{GMAIL_SENDER}>"
    msg['To'] = to_email

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px; }}
            .container {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #E65100, #F57C00); padding: 25px 20px; text-align: center; color: #ffffff; }}
            .header h2 {{ margin: 0; font-size: 20px; font-weight: bold; }}
            .header p {{ margin: 5px 0 0; font-size: 13px; color: #FFE0B2; }}
            .content {{ padding: 25px 20px; line-height: 1.6; font-size: 14px; }}
            .alert-box {{ background-color: #FFF3E0; border-left: 4px solid #E65100; padding: 15px; border-radius: 8px; margin: 20px 0; color: #E65100; font-weight: bold; font-size: 13px; }}
            .btn-container {{ text-align: center; margin: 25px 0; }}
            .btn-primary {{ display: inline-block; background-color: #E65100; color: #ffffff !important; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 5px; box-shadow: 0 2px 8px rgba(230,81,0,0.3); }}
            .btn-secondary {{ display: inline-block; background-color: #424242; color: #ffffff !important; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 5px; }}
            .footer {{ background-color: #fafafa; padding: 15px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📢 แจ้งเตือนตรวจสอบสถานะการเข้ากิจกรรม</h2>
                <p>กิจกรรมปฐมนิเทศคณะวิศวกรรมศาสตร์ รุ่นที่ 67</p>
            </div>
            <div class="content">
                <p>สวัสดีครับคุณ <strong>{student_name}</strong> (รหัสนักศึกษา: {student_id})</p>
                <p>เนื่องจากระบบพบว่าการบันทึกการเช็คชื่อเข้ากิจกรรม Day 1 หรือ Day 2 ของท่านอาจยังไม่สมบูรณ์ ขอความกรุณาโปรดตรวจสอบสถานะการเช็คชื่อของตนเองอีกครั้ง</p>
                
                <div class="alert-box">
                    ⚠️ หากท่านเข้าร่วมกิจกรรมแล้วแต่สถานะขึ้นว่ายังไม่ได้เช็คชื่อ หรือข้อมูลไม่ถูกต้อง โปรดแจ้งแอดมินพร้อมแสดงหลักฐานการเข้าร่วมกิจกรรมในแชท LINE OA
                </div>

                <div class="btn-container">
                    <a href="{STUDENT_PROFILE_URL}" class="btn-primary" target="_blank">🔍 ตรวจสอบสถานะของฉัน</a>
                    <br><br>
                    <a href="{LINE_OA_CHAT_URL}" class="btn-secondary" target="_blank">⚠️ แจ้งสถานะผิดพลาด (LINE OA)</a>
                </div>
            </div>
            <div class="footer">
                สโมสรนักศึกษาคณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี<br>
                © 2026 The Student Union of The Faculty of Engineering, KMUTT.
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_SENDER, to_email, msg.as_string())

# ==============================================================================
# 📱 2. ฟังก์ชันส่ง SMS ผ่าน macOS Messages App
# ==============================================================================
def send_mac_sms(phone_number, student_name):
    clean_phone = phone_number.strip().replace('-', '').replace(' ', '')
    if not clean_phone:
        return False, "ไม่มีเบอร์โทรศัพท์"

    if clean_phone.startswith('0'):
        clean_phone = '+66' + clean_phone[1:]

    sms_text = f"📢 แจ้งเตือนสโมสรวิศวะ มจธ.: คุณ {student_name} โปรดตรวจสอบสถานะเช็คชื่อปฐมนิเทศของตนเองอีกครั้งได้ที่: {STUDENT_PROFILE_URL} หากข้อมูลผิดพลาดโปรดทักแชท LINE OA แจ้งแอดมิน"

    applescript = f'''
    tell application "Messages"
        set targetService to 1st service whose service type is iMessage or service type is SMS
        set targetBuddy to buddy "{clean_phone}" of targetService
        send "{sms_text}" to targetBuddy
    end tell
    '''

    try:
        res = subprocess.run(['osascript', '-e', applescript], capture_output=True, text=True)
        if res.returncode == 0:
            return True, "ส่งสำเร็จ"
        else:
            return False, res.stderr.strip()
    except Exception as e:
        return False, str(e)

# ==============================================================================
# 🎯 ส่วนการทำงานหลัก (Main Execution)
# ==============================================================================
def main():
    print("=" * 85)
    print("📱✉️ ระบบส่งแจ้งเตือนทั้ง Email และ SMS ถึงนิสิต 22 คนที่ไม่ได้รับข้อความ")
    print("=" * 85)

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

    email_success = 0
    sms_success = 0

    for idx, uid in enumerate(uids, 1):
        doc = db.collection('users').document(uid).get()
        if not doc.exists:
            print(f"[{idx:2d}/{len(uids)}] ❌ ไม่พบข้อมูลใน DB สำหรับ UID: {uid}")
            continue

        data = doc.to_dict()
        student_id = data.get('studentId', '')
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        student_name = f"{first_name} {last_name}".strip()
        email = data.get('email', '') or f"{student_id}@mail.kmutt.ac.th"
        phone = data.get('phoneNumber', '') or data.get('phone', '') or data.get('tel', '')

        print(f"[{idx:2d}/{len(uids)}] 👤 คุณ {student_name} (รหัส: {student_id})")
        
        # 1. ส่ง Email
        if email:
            try:
                send_email(email, student_name, student_id)
                print(f"   ✉️ Email ({email}): ส่งสำเร็จ ✅")
                email_success += 1
            except Exception as e:
                print(f"   ✉️ Email ({email}): ล้มเหลว ❌ ({e})")

        # 2. ส่ง SMS
        if phone:
            ok, msg = send_mac_sms(phone, student_name)
            if ok:
                print(f"   📱 SMS ({phone}): ส่งสำเร็จ ✅")
                sms_success += 1
            else:
                print(f"   📱 SMS ({phone}): ล้มเหลว/ข้าม ⚠️ ({msg})")

        print("-" * 65)

    print("=" * 85)
    print("🏆 สรุปผลการส่งแจ้งเตือนทั้ง 2 ช่องทาง")
    print("=" * 85)
    print(f"✉️ ส่งทาง Email สำเร็จ: {email_success}/{len(uids)} คน")
    print(f"📱 ส่งทาง SMS สำเร็จ:   {sms_success}/{len(uids)} คน")
    print("===================================================\n")

if __name__ == '__main__':
    main()
