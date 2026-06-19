import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log("กำลังตรวจสอบข้อมูลใน Database...");
  const snapshot = await db.collection('users').get();
  let count = 0;
  
  const batch = db.batch();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    // ถ้าสถานะคือยังไม่ได้รหัส แต่ในระบบบันทึกเป็นอย่างอื่นที่ไม่ใช่ 69070500000
    if ((data.studentIdStatus === 'ยังไม่ได้รับรหัสนักศึกษา' || data.studentIdStatus === 'not_received') && data.studentId !== '69070500000') {
      batch.update(doc.ref, { studentId: '69070500000' });
      count++;
      console.log(`- กำลังแก้รหัสให้: ${data.firstName} ${data.lastName} (เดิม: ${data.studentId})`);
    } else if (data.studentId === '6907050' || data.studentId === '69') {
      batch.update(doc.ref, { studentId: '69070500000' });
      count++;
      console.log(`- กำลังแก้รหัสให้: ${data.firstName} ${data.lastName} (เดิม: ${data.studentId})`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`\n✅ แก้ไขข้อมูลให้ถูกต้องเรียบร้อยแล้วทั้งหมด ${count} คน!`);
  } else {
    console.log(`\n✅ ไม่มีข้อมูลที่ผิดพลาดต้องแก้ไขแล้วครับ ทุกคนถูกต้องหมดแล้ว`);
  }
  process.exit(0);
}

run();
