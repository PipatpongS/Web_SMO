import fs from 'fs';
import path from 'path';

// ==========================================
// 1. ใส่ LINE Channel Access Token ของคุณที่นี่
// Use environment variable for the token to prevent leaking secrets in source control
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN || 'YOUR_LINE_ACCESS_TOKEN_HERE';

// ==========================================
// 2. ใส่ URL สำหรับปุ่มนำทางทั้ง 2 ปุ่มที่นี่
// ==========================================
const BUTTON_1_URL = 'https://liff.line.me/YOUR_LIFF_ID_1'; // ปุ่มซ้าย
const BUTTON_2_URL = 'https://liff.line.me/YOUR_LIFF_ID_2'; // ปุ่มขวา

const IMAGE_PATH = path.resolve('./Rich-menu-compressed.jpg');

async function setupRichMenu() {
  if (!LINE_ACCESS_TOKEN) {
    console.error('❌ Error: กรุณาใส่ LINE_ACCESS_TOKEN ก่อนรัน');
    return;
  }

  try {
    // 1. สร้าง Rich Menu
    console.log('⏳ 1. กำลังสร้างข้อมูล Rich Menu...');
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
        chatBarText: 'เมนูหลัก',
        areas: [
          {
            bounds: { x: 0, y: 0, width: 1250, height: 843 },
            action: { type: 'uri', uri: BUTTON_1_URL }
          },
          {
            bounds: { x: 1250, y: 0, width: 1250, height: 843 },
            action: { type: 'uri', uri: BUTTON_2_URL }
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
    console.log('🎉 เสร็จสมบูรณ์! ตั้งค่า Rich Menu เป็นค่าเริ่มต้นเรียบร้อยแล้ว');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

setupRichMenu();
