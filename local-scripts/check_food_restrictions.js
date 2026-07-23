import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// อัปเดต Path ให้ตรงกับไฟล์ credential
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

// ============================================
// ⚠️ จุดที่ต้องแก้ไข ⚠️
// 1. กำหนดชื่อ Collection ที่ใช้เก็บข้อมูล
const COLLECTION_NAME = 'users'; // หรือ 'staff_applicants'

// 2. ตั้งชื่อ Field ใน Database ที่เก็บข้อมูลเรื่องอาหาร
const FIELD_HAS_RESTRICTION = 'hasDietaryRestriction'; // ชื่อฟิลด์ที่เก็บค่า "ไม่มี" หรือ "มี"
const FIELD_RESTRICTION_LIST = 'dietaryRestriction'; // ชื่อฟิลด์ที่เก็บ Array ของข้อจำกัด (ถ้าเลือก "มี")
// ============================================

async function checkFoodRestrictions() {
  try {
    console.log(`\nกำลังดึงข้อมูลจาก Collection: '${COLLECTION_NAME}'... (อาจใช้เวลาสักครู่)`);
    
    // ดึงข้อมูลทั้งหมดมาไว้ใน Memory 1 ครั้ง (ใช้ Read = จำนวนคนทั้งหมด)
    const snapshot = await db.collection(COLLECTION_NAME).get();
    
    let totalUsers = snapshot.size;
    
    // สร้างตัวแปรเก็บจำนวนแต่ละประเภท
    const foodStats = {
      'อาหารปกติ (ไม่มีข้อจำกัด)': 0,
      'อิสลาม (ฮาลาล)': 0,
      'มังสวิรัติ': 0,
      'วีแกน': 0,
      'แพ้อาหารบางชนิด': 0,
      'อื่นๆ': 0,
      'ไม่ได้ระบุข้อมูลอาหาร': 0
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // ดึงค่าจาก Database ขึ้นอยู่กับโครงสร้างที่คุณใช้
      // (กรุณาแก้ชื่อฟิลด์ด้านบนให้ตรงกับในฐานข้อมูลของคุณ)
      const hasRestriction = data[FIELD_HAS_RESTRICTION];
      const restrictionList = data[FIELD_RESTRICTION_LIST] || []; // เป็น Array เช่น ['มังสวิรัติ', 'วีแกน']

      // เช็คว่าเป็นอาหารปกติหรือไม่
      if (hasRestriction === 'ไม่มี' || !hasRestriction) {
        foodStats['อาหารปกติ (ไม่มีข้อจำกัด)']++;
        return; // ทำคนถัดไป
      }
      
      // กรณีตอบว่า "มี" ข้อจำกัด
      if (hasRestriction === 'มี') {
        if (Array.isArray(restrictionList) && restrictionList.length > 0) {
          // วนเช็คทีละตัวเลือกที่เขาติ๊กมา
          restrictionList.forEach(food => {
            if (food.includes('ฮาลาล') || food.includes('อิสลาม')) foodStats['อิสลาม (ฮาลาล)']++;
            else if (food.includes('มังสวิรัติ')) foodStats['มังสวิรัติ']++;
            else if (food.includes('วีแกน')) foodStats['วีแกน']++;
            else if (food.includes('แพ้อาหาร')) foodStats['แพ้อาหารบางชนิด']++;
            else foodStats['อื่นๆ']++;
          });
        } else {
           // กรณีตอบว่ามี แต่ไม่ได้ติ๊กตัวเลือกย่อยเลย
           foodStats['ไม่ได้ระบุข้อมูลอาหาร']++;
        }
      }
    });

    console.log('\n=== สรุปยอดข้อมูลอาหาร ===');
    console.log(`ผู้เข้าร่วมทั้งหมด: ${totalUsers} คน\n`);
    
    console.log(`[+] อาหารปกติ (ไม่มีข้อจำกัด): ${foodStats['อาหารปกติ (ไม่มีข้อจำกัด)']} คน`);
    console.log(`[+] อิสลาม (ฮาลาล):         ${foodStats['อิสลาม (ฮาลาล)']} คน`);
    console.log(`[+] มังสวิรัติ:              ${foodStats['มังสวิรัติ']} คน`);
    console.log(`[+] วีแกน:                 ${foodStats['วีแกน']} คน`);
    console.log(`[+] แพ้อาหารบางชนิด:        ${foodStats['แพ้อาหารบางชนิด']} คน`);
    console.log(`[+] อื่นๆ:                 ${foodStats['อื่นๆ']} คน`);
    
    if (foodStats['ไม่ได้ระบุข้อมูลอาหาร'] > 0) {
      console.log(`[!] ตอบว่ามี แต่ไม่ระบุย่อย:  ${foodStats['ไม่ได้ระบุข้อมูลอาหาร']} คน`);
    }
    
    console.log('\n(หมายเหตุ: ยอดย่อยอาจบวกกันแล้วเกินยอดผู้เข้าร่วมรวมได้ เนื่องจาก 1 คนสามารถติ๊กเลือกข้อจำกัดได้หลายข้อ)\n');

  } catch (error) {
    console.error('\n[Error] เกิดข้อผิดพลาด:', error.message);
  } finally {
    process.exit(0);
  }
}

checkFoodRestrictions();
