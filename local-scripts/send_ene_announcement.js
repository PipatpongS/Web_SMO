import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load LINE_ACCESS_TOKEN from .env.backend
dotenv.config({ path: path.resolve('../apps/student-reg/.env.backend') });
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// Initialize Firebase Admin
const serviceAccountPath = './smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

const ANNOUNCEMENT_TEXT = `📣 ประกาศเพิ่มเติมเกี่ยวกับการรับเสื้อแดงวิศวะ วันที่ 24 กรกฎาคม 2569

เนื่องจากปัญหาการเดินทางโดยรถรับส่งจากวิทยาเขตบางขุนเทียนของนักศึกษาสาขาวิชาเซมิคอนดักเตอร์ ทางสโมวิศวฯ ขออนุโลมให้นักศึกษาสาขาวิชาดังกล่าวมารับเสื้อที่อาคารสโมวิศวฯ (ตั้งอยู่ระหว่างอาคาร S11 และ S12)

🗓️ วันที่ 25 กรกฎาคม 2569 
เวลา 16.00–18.00 น.

สำหรับนักศึกษาภาควิชาอื่น ๆ ขอให้มารับเสื้อในวันที่ 24 กรกฎาคม 2569 ตามกำหนดการเท่านั้น เพื่อให้การดำเนินการรับเสื้อเป็นไปด้วยความเรียบร้อย

แต่หากน้องคนไหนมีเหตุจำเป็น ขอให้แจ้ง ชื่อ–นามสกุล, รหัสนักศึกษา, ภาควิชา และเหตุผล เพื่อให้ทางผู้จัดพิจารณาและแจ้งรายละเอียดการรับเสื้อในภายหลังค่ะ`;

const TARGET_DEPARTMENT = "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม";

async function main() {
  console.log(`🔍 Fetching users for department: "${TARGET_DEPARTMENT}"...`);
  
  const snapshot = await db.collection('users').get();
  const targetUserIds = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const dept = data.department ? data.department.trim() : '';
    const userId = doc.id;
    
    // Check department match and valid LINE User ID format (starts with U and length == 33)
    if (dept === TARGET_DEPARTMENT && userId.startsWith('U') && userId.length === 33) {
      targetUserIds.push(userId);
    }
  });

  console.log(`📊 Found ${targetUserIds.length} users with valid LINE IDs in ${TARGET_DEPARTMENT}.`);

  if (targetUserIds.length === 0) {
    console.log("❌ No matching users found.");
    process.exit(0);
  }

  // LINE Multicast API allows max 500 userIds per call
  const BATCH_SIZE = 500;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetUserIds.length; i += BATCH_SIZE) {
    const batchUserIds = targetUserIds.slice(i, i + BATCH_SIZE);
    
    const messageData = {
      to: batchUserIds,
      messages: [
        {
          type: "text",
          text: ANNOUNCEMENT_TEXT
        }
      ]
    };

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        console.log(`✅ Multicast batch ${Math.floor(i / BATCH_SIZE) + 1} succeeded (${batchUserIds.length} recipients)`);
        successCount += batchUserIds.length;
      } else {
        const errJson = await response.json();
        console.error(`❌ Multicast batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errJson);
        failCount += batchUserIds.length;
      }
    } catch (err) {
      console.error(`❌ Error sending batch:`, err);
      failCount += batchUserIds.length;
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 Broadcast Summary for ${TARGET_DEPARTMENT}:`);
  console.log(`✅ Sent Successfully: ${successCount} users`);
  console.log(`❌ Failed: ${failCount} users`);
  console.log(`========================================\n`);
  
  process.exit(0);
}

main();
