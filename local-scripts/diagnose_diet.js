import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath = './smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function run() {
  // Check users
  const usersSnapshot = await db.collection('users').get();
  console.log(`ตรวจสอบข้อมูลของ users ทั้งหมด ${usersSnapshot.size} คน...`);

  let usersArray = 0, usersMoreThanOne = 0;
  usersSnapshot.forEach(doc => {
    const diet = doc.data().dietaryRestriction;
    if (Array.isArray(diet)) {
      usersArray++;
      if (diet.length > 1) {
        usersMoreThanOne++;
        console.log(`[Users > 1] User ID: ${doc.id}, Name: ${doc.data().firstName} ${doc.data().lastName}, Data:`, diet);
      }
    }
  });

  // Check staff_applicants
  const staffSnapshot = await db.collection('staff_applicants').get();
  console.log(`ตรวจสอบข้อมูลของ staff_applicants ทั้งหมด ${staffSnapshot.size} คน...`);

  let staffArray = 0, staffMoreThanOne = 0;
  staffSnapshot.forEach(doc => {
    const diet = doc.data().dietaryRestriction;
    if (Array.isArray(diet)) {
      staffArray++;
      if (diet.length > 1) {
        staffMoreThanOne++;
        console.log(`[Staff > 1] User ID: ${doc.id}, Name: ${doc.data().firstName} ${doc.data().lastName}, Data:`, diet);
      }
    }
  });

  console.log('\n=== สรุปประเภทฟิลด์ dietaryRestriction ===');
  console.log(`Users - เป็น Array: ${usersArray} คน (มีคนเลือกมากกว่า 1 อย่าง: ${usersMoreThanOne} คน)`);
  console.log(`Staff - เป็น Array: ${staffArray} คน (มีคนเลือกมากกว่า 1 อย่าง: ${staffMoreThanOne} คน)`);
  
  process.exit(0);
}

run();
