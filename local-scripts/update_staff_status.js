import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function run() {
  let serviceAccountFile = './serviceAccountKey.json';
  
  // ค้นหาไฟล์คีย์อัตโนมัติในโฟลเดอร์ปัจจุบัน
  if (!fs.existsSync(serviceAccountFile)) {
    try {
      const files = fs.readdirSync('.');
      const adminSdkFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      if (adminSdkFile) {
        serviceAccountFile = `./${adminSdkFile}`;
      }
    } catch (e) {
      console.warn('⚠️ เกิดข้อผิดพลาดขณะค้นหาไฟล์คีย์:', e.message);
    }
  }
  
  if (!fs.existsSync(serviceAccountFile)) {
    console.error('❌ Error: ไม่พบไฟล์คีย์ Firebase (serviceAccountKey.json หรือไฟล์ firebase-adminsdk-*.json)');
    process.exit(1);
  }

  console.log(`🔑 ใช้ไฟล์คีย์: ${serviceAccountFile}`);
  const serviceAccount = require(serviceAccountFile);

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    
    const db = getFirestore();

    console.log('⏳ กำลังดึงข้อมูลจากคอลเลกชัน "staff_applicants"...');
    const staffSnapshot = await db.collection('staff_applicants').get();
    
    if (staffSnapshot.empty) {
      console.log('ℹ️ ไม่พบข้อมูลผู้สมัครในระบบ');
      process.exit(0);
    }

    console.log(`🔍 พบผู้สมัครทั้งหมด ${staffSnapshot.size} คน กำลังเริ่มอัปเดตสถานะ...`);
    
    let updateCount = 0;
    const batch = db.batch();

    staffSnapshot.forEach(doc => {
      const data = doc.data();
      const role1 = data.role1;
      const nickname = data.nickname || data.firstName || 'ไม่ระบุชื่อ';

      if (role1) {
        const newStatus = `ได้รับการคัดเลือกให้ปฏิบัติงานในตำแหน่ง ${role1}`;
        
        // อัปเดตเฉพาะกรณีที่สถานะไม่ตรงกับสถานะใหม่ เพื่อป้องกันการอัปเดตซ้ำซ้อน
        if (data.staffStatus !== newStatus) {
          const docRef = db.collection('staff_applicants').add ? db.collection('staff_applicants').doc(doc.id) : doc.ref;
          batch.update(docRef, { staffStatus: newStatus });
          console.log(`✍️ เตรียมอัปเดต [${nickname}]: "${data.staffStatus || 'ไม่มีสถานะเดิม'}" ➡️ "${newStatus}"`);
          updateCount++;
        }
      } else {
        console.log(`⚠️ ข้าม [${nickname}]: เนื่องจากไม่มีข้อมูลในฟิลด์ role1`);
      }
    });

    if (updateCount > 0) {
      console.log('⏳ กำลังบันทึกการอัปเดตลงฐานข้อมูล Firestore...');
      await batch.commit();
      console.log(`🎉 สำเร็จ! อัปเดตสถานะของ Staff เรียบร้อยทั้งหมด ${updateCount} รายการ`);
    } else {
      console.log('✅ ไม่มีข้อมูลที่จำเป็นต้องอัปเดต (ทุกท่านมีสถานะตรงกับตำแหน่ง role1 อยู่แล้ว)');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

run();
