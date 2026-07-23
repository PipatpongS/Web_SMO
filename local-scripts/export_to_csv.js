import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Helper function to convert JSON array to CSV string
function convertToCSV(dataArray) {
  if (dataArray.length === 0) return 'ไม่มีข้อมูล';

  // ค้นหาคีย์ทั้งหมดที่มีในเอกสารทั้งหมดเพื่อสร้างเป็นหัวคอลัมน์ (Headers)
  const allKeys = new Set();
  dataArray.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys).sort(); // เรียงลำดับชื่อฟิลด์ตามตัวอักษรเพื่อความเรียบร้อย

  const csvRows = [];
  
  // ใส่หัวข้อตาราง (Header row)
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // ใส่ข้อมูลในแต่ละแถว (Data rows)
  dataArray.forEach(item => {
    const rowValues = headers.map(header => {
      const val = item[header];
      if (val === undefined || val === null) {
        return '""';
      }
      // จัดการกับข้อมูลประเภท Array (เช่น dietaryRestriction)
      if (Array.isArray(val)) {
        return `"${val.join(', ').replace(/"/g, '""')}"`;
      }
      // จัดการกับข้อมูลประเภท Object หรือ Timestamp
      if (typeof val === 'object') {
        if (typeof val.toDate === 'function') {
          return `"${val.toDate().toISOString().replace(/"/g, '""')}"`;
        }
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      // แปลงข้อมูลทั่วไปเป็น String
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(rowValues.join(','));
  });

  // ใช้ \ufeff เพื่อระบุว่าเป็น UTF-8 with BOM ให้ Excel เปิดมาแล้วอ่านภาษาไทยได้ถูกต้อง ไม่เป็นต่างดาว
  return '\ufeff' + csvRows.join('\r\n');
}

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

    // 1. ดึงและส่งออกข้อมูลผู้สมัคร Staff (staff_applicants)
    console.log('⏳ กำลังดึงข้อมูลจากคอลเลกชัน "staff_applicants"...');
    const staffSnapshot = await db.collection('staff_applicants').get();
    const staffData = [];
    staffSnapshot.forEach(doc => {
      staffData.push({ id: doc.id, ...doc.data() });
    });
    
    const staffCsv = convertToCSV(staffData);
    const staffCsvPath = './staff_applicants.csv';
    fs.writeFileSync(staffCsvPath, staffCsv, 'utf8');
    console.log(`✅ ส่งออกไฟล์ Staff สำเร็จ! (${staffData.length} แถว) -> ${path.resolve(staffCsvPath)}`);

    // 2. ดึงและส่งออกข้อมูลผู้ใช้ทั่วไป/นักศึกษา (users)
    console.log('⏳ กำลังดึงข้อมูลจากคอลเลกชัน "users"...');
    const usersSnapshot = await db.collection('users').get();
    const usersData = [];
    usersSnapshot.forEach(doc => {
      usersData.push({ id: doc.id, ...doc.data() });
    });
    
    const usersCsv = convertToCSV(usersData);
    const usersCsvPath = './users.csv';
    fs.writeFileSync(usersCsvPath, usersCsv, 'utf8');
    console.log(`✅ ส่งออกไฟล์ Users สำเร็จ! (${usersData.length} แถว) -> ${path.resolve(usersCsvPath)}`);

    console.log('\n🎉 ส่งออกข้อมูลทั้งหมดเรียบร้อยแล้ว!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

run();
