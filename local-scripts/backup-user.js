import { writeFileSync, readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const userId = 'U5f2d4ab18bbad37f15b1d5aea32048b2';
  const docRef = db.collection('users').doc(userId);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    const data = docSnap.data();
    // Add the ID back into the JSON for reference
    data._userId = userId; 
    
    writeFileSync('Delete_user.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('✅ ดึงข้อมูลสำเร็จ! บันทึกลงไฟล์ Delete_user.json เรียบร้อยแล้วครับ');
  } else {
    console.log('❌ ไม่พบข้อมูลผู้ใช้รหัสนี้ในฐานข้อมูลครับ');
  }
  process.exit(0);
}

run();
