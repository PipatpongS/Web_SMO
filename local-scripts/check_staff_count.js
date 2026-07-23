import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// อัปเดต Path ให้ตรงกับไฟล์ credential ที่มีในโฟลเดอร์นี้
const serviceAccountPath = './smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n[Error] ไม่พบไฟล์ credential:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

// กำหนดชื่อ Collection ที่ใช้เก็บข้อมูลผู้สมัคร (เปลี่ยนให้ตรงกับ Database)
const COLLECTION_NAME = 'users';

async function getApplicantCounts() {
  try {
    console.log(`\nกำลังคำนวณจำนวนผู้สมัครจาก Collection: '${COLLECTION_NAME}'...`);
    const applicantsRef = db.collection(COLLECTION_NAME);

    // 1. ดึงจำนวนทั้งหมด (Total)
    const totalQuery = applicantsRef.count();

    // 2. ดึงจำนวนรอบพิเศษ (Note == "รอบพิเศษ")
    const specialQuery = applicantsRef.where('Note', '==', 'รอบพิเศษ').count();

    // รัน Query พร้อมกันทั้ง 2 ตัวเพื่อความรวดเร็ว
    const [totalSnap, specialSnap] = await Promise.all([
      totalQuery.get(),
      specialQuery.get()
    ]);

    const totalCount = totalSnap.data().count;
    const specialCount = specialSnap.data().count;

    // 3. รอบปกติ (คำนวณจากยอดรวม ลบด้วย ยอดรอบพิเศษ)
    const normalCount = totalCount - specialCount;

    console.log('\n=== สรุปยอดผู้สมัคร Staff ===');
    console.log(`รอบปกติ (Normal):   ${normalCount} คน`);
    console.log(`รอบพิเศษ (Special): ${specialCount} คน`);
    console.log(`---------------------------`);
    console.log(`รวมทั้งหมด (Total):  ${totalCount} คน\n`);

  } catch (error) {
    console.error('\n[Error] เกิดข้อผิดพลาดในการดึงข้อมูล:', error.message);
  } finally {
    process.exit(0);
  }
}

getApplicantCounts();
