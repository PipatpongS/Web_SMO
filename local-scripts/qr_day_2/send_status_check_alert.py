import os
import csv
import json
import urllib.request

# ==============================================================================
# ⚙️ การตั้งค่าหลัก (CONFIGURATION)
# ==============================================================================

# 1. โหมดทดสอบ (DRY_RUN):
#    • True  = ส่งข้อความทดสอบไปยัง TEST_UID คนเดียวเท่านั้น (เสีย Quota LINE แค่ 1 คน)
#    • False = ยิงข้อความจริงไปยังผู้ที่ยังไม่ได้เช็คชื่อทั้งหมด 315 คน
DRY_RUN = True

# 2. LINE UID สำหรับทดสอบ (Test UID):
TEST_UID = 'U639762d7e2dc60e6f184700fc9de7aa7'

# 3. ไฟล์ข้อมูล LINE UIDs ที่อ่านจากระบบ:
CSV_UID_PATH = '/Users/buaboocha.bs/Documents/Rak-File/Web_smo/Dev/frontend-reg/local-scripts/qr_day_2/line_uids_not_checked_in.csv'

# 4. LINE Channel Access Token:
LINE_ACCESS_TOKEN = 'J/WvWQsY9KciLEE6q70BoLdmsDIu684LgfX6l0wiTntIzJuJ6kfPuSWuTqIHw5WJd0gUTDBGAYbm9yn41vwpCAcxVBti0//Q+f1GkD8ZYa04iDp/H4tgmfhq7MCk6zBS1mXelMYih/zV66IlOuv+zQdB04t89/1O/w1cDnyilFU='

# 5. ลิงก์สำหรับปุ่มกดใน Flex Message (ต้องใช้ Student LIFF ID: 2010390110-fPHy5j81):
CHECK_STATUS_URL = 'https://liff.line.me/2010390110-fPHy5j81/profile'       # ลิงก์ไปหน้าโปรไฟล์นักศึกษา (Student Profile)

# ==============================================================================
# 📱 สร้างข้อความ LINE Flex Message
# ==============================================================================
def create_status_check_flex_message():
    return {
        'type': 'flex',
        'altText': '📢 แจ้งเตือน: กรุณาตรวจสอบสถานะการเข้ากิจกรรม',
        'contents': {
            'type': 'bubble',
            'header': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': '📢 แจ้งเตือนตรวจสอบสถานะ',
                        'weight': 'bold',
                        'color': '#FFFFFF',
                        'size': 'lg'
                    },
                    {
                        'type': 'text',
                        'text': 'กิจกรรมปฐมนิเทศคณะวิศวกรรมศาสตร์ รุ่นที่ 67',
                        'color': '#FFE0B2',
                        'size': 'xs',
                        'margin': 'xs'
                    }
                ],
                'backgroundColor': '#E65100',
                'paddingAll': 'md'
            },
            'body': {
                'type': 'box',
                'layout': 'vertical',
                'contents': [
                    {
                        'type': 'text',
                        'text': 'สวัสดีครับ',
                        'weight': 'bold',
                        'size': 'sm',
                        'color': '#111111'
                    },
                    {
                        'type': 'text',
                        'text': 'โปรดตรวจสอบสถานะการเช็คชื่อของตนเองอีกครั้ง',
                        'size': 'xs',
                        'color': '#444444',
                        'wrap': True,
                        'margin': 'md'
                    },
                    {
                        'type': 'box',
                        'layout': 'vertical',
                        'margin': 'md',
                        'paddingAll': 'md',
                        'backgroundColor': '#FFF3E0',
                        'cornerRadius': 'md',
                        'contents': [
                            {
                                'type': 'text',
                                'text': '⚠️ หากท่านเข้าร่วมกิจกรรมแล้วแต่สถานะขึ้นว่ายังไม่ได้เช็คชื่อ หรือข้อมูลไม่ถูกต้อง โปรดแจ้งแอดมินพร้อมแสดงหลักฐานการเข้าร่วมกิจกรรมในแชทนี้',
                                'size': 'xs',
                                'color': '#E65100',
                                'wrap': True,
                                'weight': 'bold'
                            }
                        ]
                    }
                ]
            },
            'footer': {
                'type': 'box',
                'layout': 'vertical',
                'spacing': 'sm',
                'contents': [
                    {
                        'type': 'button',
                        'style': 'primary',
                        'color': '#E65100',
                        'height': 'sm',
                        'action': {
                            'type': 'uri',
                            'label': '🔍 ตรวจสอบสถานะของฉัน',
                            'uri': CHECK_STATUS_URL
                        }
                    },
                    {
                        'type': 'button',
                        'style': 'secondary',
                        'height': 'sm',
                        'action': {
                            'type': 'message',
                            'label': '⚠️ แจ้งสถานะผิดพลาด',
                            'text': 'แจ้งสถานะผิดพลาด'
                        }
                    }
                ]
            }
        }
    }

# ==============================================================================
# 🚀 ฟังก์ชันส่งข้อความผ่าน LINE Multicast API
# ==============================================================================
def send_multicast_message(target_uids, flex_msg):
    url = 'https://api.line.me/v2/bot/message/multicast'
    
    payload = {
        'to': target_uids,
        'messages': [flex_msg]
    }

    data_bytes = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {LINE_ACCESS_TOKEN}'
        }
    )

    try:
        with urllib.request.urlopen(req) as response:
            return {'success': True, 'status': response.status, 'count': len(target_uids)}
    except Exception as e:
        return {'success': False, 'error': str(e), 'count': len(target_uids)}

# ==============================================================================
# 🎯 ส่วนการทำงานหลัก (Main Execution)
# ==============================================================================
def main():
    print("=" * 70)
    print("📱 ระบบส่งข้อความแจ้งเตือนตรวจสอบสถานะ (LINE Status Check Notification)")
    print("=" * 70)

    if DRY_RUN:
        print("🧪 [โหมดทดสอบ: DRY_RUN = True]")
        print(f"👉 จะส่งข้อความหา LINE UID เดียวเท่านั้น: {TEST_UID}")
        print("💡 เสีย Quota ข้อความ LINE เพียง 1 คนเท่านั้น!")
        target_uids = [TEST_UID]
    else:
        print("🚀 [โหมดส่งจริง: DRY_RUN = False]")
        if not os.path.exists(CSV_UID_PATH):
            print(f"❌ ไม่พบไฟล์ CSV ที่: {CSV_UID_PATH}")
            return

        target_uids = []
        with open(CSV_UID_PATH, encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if row and row[0].strip().startswith('U'):
                    target_uids.append(row[0].strip())

        print(f"📁 อ่าน LINE UIDs จาก CSV ได้ทั้งหมด {len(target_uids)} คน")

    if not target_uids:
        print("⚠️ ไม่พบรายชื่อ LINE UID ในการส่งข้อความ")
        return

    print("--------------------------------------------------")
    print(f"✉️ กำลังจัดเตรียมข้อความ Flex Message...")
    flex_msg = create_status_check_flex_message()

    # LINE Multicast API รองรับสูงสุด 500 uids ต่อ 1 batch
    BATCH_SIZE = 500
    total_success = 0
    total_failed = 0

    for i in range(0, len(target_uids), BATCH_SIZE):
        batch = target_uids[i:i + BATCH_SIZE]
        print(f"📤 กำลังส่ง Batch {i // BATCH_SIZE + 1} (จำนวน {len(batch)} รายชื่อ)...")

        result = send_multicast_message(batch, flex_msg)

        if result['success']:
            print(f" ✅ Batch {i // BATCH_SIZE + 1} ส่งสำเร็จ! ({result['count']} คน)")
            total_success += result['count']
        else:
            print(f" ❌ Batch {i // BATCH_SIZE + 1} ล้มเหลว: {result['error']}")
            total_failed += result['count']

    print("=" * 70)
    print("🏆 สรุปผลการส่งข้อความแจ้งเตือน")
    print("=" * 70)
    print(f"โหมดการทำงาน: {'🧪 DRY_RUN (ทดสอบส่ง 1 คน)' if DRY_RUN else '🚀 LIVE (ส่งจริงทุกคน)'}")
    print(f"จำนวนที่ส่งสำเร็จ: {total_success} คน")
    print(f"จำนวนที่ล้มเหลว:   {total_failed} คน")
    print("==================================================\n")

if __name__ == '__main__':
    main()
