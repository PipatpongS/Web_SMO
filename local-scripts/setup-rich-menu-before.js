import fs from 'fs';
import path from 'path';

// ==========================================
// 1. ใส่ LINE Channel Access Token ในไฟล์ .env ด้วยชื่อ LINE_ACCESS_TOKEN
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// ==========================================
// 2. URL สำหรับปุ่ม
// ข้อสำคัญ: ปุ่มซ้ายต้องใช้ลิงก์ LIFF เพื่อให้ระบบดึงข้อมูลโปรไฟล์ LINE ของนักศึกษาได้อัตโนมัติ
// ห้ามใช้ลิงก์ Vercel ตรงๆ ไม่อย่างนั้นนักศึกษาจะต้องล็อกอินใหม่บนเบราว์เซอร์
const BUTTON_LEFT_URL = 'https://liff.line.me/2010390110-fPHy5j81'; 
const BUTTON_RIGHT_URL = 'https://www.instagram.com/samovidva_bangmod?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

// ชื่อไฟล์รูป Rich Menu ที่ถูกบีบอัดแล้วให้ขนาดไม่เกิน 1MB (LINE บังคับ)
const IMAGE_PATH = path.resolve('./rich_menu_before_register.jpg');

async function setupRichMenu() {
  if (!LINE_ACCESS_TOKEN) {
    console.error('❌ Error: ไม่พบ LINE_ACCESS_TOKEN ในไฟล์ .env');
    return;
  }

  try {
    // 1. สร้าง Rich Menu
    console.log('⏳ 1. กำลังสร้างข้อมูล Rich Menu (Before Register)...');
    const createResponse = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        size: { width: 2500, height: 843 },
        selected: true,
        name: 'Menu Before Register',
        chatBarText: 'เมนู / Menu',
        areas: [
          {
            bounds: { x: 0, y: 0, width: 1696, height: 843 },
            action: { type: 'uri', uri: BUTTON_LEFT_URL }
          },
          {
            bounds: { x: 1696, y: 0, width: 804, height: 843 },
            action: { type: 'uri', uri: BUTTON_RIGHT_URL }
          }
        ]
      })
    });

    const createData = await createResponse.json();
    if (!createResponse.ok) throw new Error(`Create Menu Failed: ${JSON.stringify(createData)}`);

    const richMenuId = createData.richMenuId;
    console.log(`✅ สร้าง Rich Menu สำเร็จ! ID: ${richMenuId}`);

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

    // 3. ตั้งค่าเป็น Rich Menu เริ่มต้น
    console.log('⏳ 3. กำลังตั้งค่าให้เป็น Rich Menu เริ่มต้นสำหรับทุกคน...');
    const setDefaultResponse = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });

    if (!setDefaultResponse.ok) {
      const setDefaultData = await setDefaultResponse.json();
      throw new Error(`Set Default Failed: ${JSON.stringify(setDefaultData)}`);
    }
    console.log('🎉 เสร็จสมบูรณ์! ตั้งค่า Rich Menu สำหรับก่อนลงทะเบียน เป็นค่าเริ่มต้นเรียบร้อยแล้ว');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

setupRichMenu();
