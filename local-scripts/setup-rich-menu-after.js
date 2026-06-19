import fs from 'fs';
import path from 'path';

// ==========================================
// 1. อ่านค่า Token จาก .env
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// ==========================================
// 2. URL สำหรับปุ่มนำทาง
// ปุ่มซ้าย: ไปหน้า Profile (ผ่าน LIFF)
const BUTTON_LEFT_URL = 'https://liff.line.me/2010390110-fPHy5j81/profile'; 
// ปุ่มขวาบน: ไปหน้า Home (ผ่าน LIFF)
const BUTTON_RIGHT_TOP_URL = 'https://liff.line.me/2010390110-fPHy5j81';
// ปุ่มขวาล่าง: Instagram
const BUTTON_RIGHT_BOTTOM_URL = 'https://www.instagram.com/samovidva_bangmod?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

// รูปภาพบีบอัดสำหรับ หลังลงทะเบียน
const IMAGE_PATH = path.resolve('./rich_menu_after_register.jpg');

async function setupRichMenuAfter() {
  if (!LINE_ACCESS_TOKEN) {
    console.error('❌ Error: ไม่พบ LINE_ACCESS_TOKEN ในไฟล์ .env');
    return;
  }

  try {
    // 1. สร้าง Rich Menu
    console.log('⏳ 1. กำลังสร้างข้อมูล Rich Menu (After Register)...');
    const createResponse = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        size: { width: 2500, height: 1686 },
        selected: true,
        name: 'Menu After Register',
        chatBarText: 'เมนู / Menu',
        areas: [
          {
            // ซ้าย (Profile) กว้าง 0-1610
            bounds: { x: 0, y: 0, width: 1610, height: 1686 },
            action: { type: 'uri', uri: BUTTON_LEFT_URL }
          },
          {
            // ขวาบน (Home) กว้าง 1610-2500, สูง 0-843
            bounds: { x: 1610, y: 0, width: 890, height: 843 },
            action: { type: 'uri', uri: BUTTON_RIGHT_TOP_URL }
          },
          {
            // ขวาล่าง (Instagram) กว้าง 1610-2500, สูง 843-1686
            bounds: { x: 1610, y: 843, width: 890, height: 843 },
            action: { type: 'uri', uri: BUTTON_RIGHT_BOTTOM_URL }
          }
        ]
      })
    });

    const createData = await createResponse.json();
    if (!createResponse.ok) throw new Error(`Create Menu Failed: ${JSON.stringify(createData)}`);

    const richMenuId = createData.richMenuId;
    console.log(`✅ สร้าง Rich Menu สำเร็จ! ID: ${richMenuId}`);
    console.log(`⚠️ โปรดจด ID นี้ไว้: ${richMenuId}`);

    // 2. อัปโหลดรูปภาพ
    console.log('⏳ 2. กำลังอัปโหลดรูปภาพ...');
    const imageBuffer = fs.readFileSync(IMAGE_PATH);
    const uploadResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const uploadData = await uploadResponse.text();
      throw new Error(`Upload Image Failed: ${uploadData}`);
    }
    console.log('✅ อัปโหลดรูปภาพสำเร็จ!');

    // *** สังเกต: เราจะไม่ใช้ API เพื่อตั้งเป็นค่าเริ่มต้น (Default) ***
    // เพราะเมนูนี้จะโชว์เฉพาะ "คนที่ลงทะเบียนแล้ว" เท่านั้น
    console.log('🎉 เสร็จสมบูรณ์! สร้าง Rich Menu "หลังลงทะเบียน" เรียบร้อยแล้ว (ยังไม่ผูกกับใคร)');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

setupRichMenuAfter();
