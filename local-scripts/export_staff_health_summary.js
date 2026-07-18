import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function convertToCSV(dataArray) {
  if (dataArray.length === 0) return 'ไม่มีข้อมูล';
  const allKeys = new Set();
  dataArray.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys).sort();
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  dataArray.forEach(item => {
    const rowValues = headers.map(header => {
      const val = item[header];
      if (val === undefined || val === null) return '""';
      if (Array.isArray(val)) return `"${val.join(', ').replace(/"/g, '""')}"`;
      if (typeof val === 'object') {
        if (typeof val.toDate === 'function') return `"${val.toDate().toISOString().replace(/"/g, '""')}"`;
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(rowValues.join(','));
  });
  return '\ufeff' + csvRows.join('\r\n');
}

async function run() {
  let serviceAccountFile = './serviceAccountKey.json';
  if (!fs.existsSync(serviceAccountFile)) {
    try {
      const files = fs.readdirSync('.');
      const adminSdkFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      if (adminSdkFile) serviceAccountFile = `./${adminSdkFile}`;
    } catch (e) {}
  }
  
  if (!fs.existsSync(serviceAccountFile)) {
    console.error('❌ Error: ไม่พบไฟล์คีย์ Firebase (serviceAccountKey.json หรือไฟล์ firebase-adminsdk-*.json)');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountFile);
  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  const db = getFirestore();

  console.log('⏳ กำลังดึงข้อมูลจากคอลเลกชัน "staff_applicants"...');
  const staffSnapshot = await db.collection('staff_applicants').get();
  const staffData = [];
  
  // Data structures for summary
  const healthSummary = {
    dietary: {},
    allergy: {},
    medical: {}
  };

  const addSummary = (category, detail, nickname) => {
    if (!detail) return;
    
    // Normalize string (trim spaces)
    let detailsArray = [];
    if (Array.isArray(detail)) {
        detailsArray = detail;
    } else {
        if (typeof detail === 'string') {
            if (detail.trim() === '' || detail === 'ไม่มี' || detail === '-') return;
            detailsArray = detail.split(',').map(s => s.trim()).filter(s => s);
        } else {
            detailsArray = [String(detail)];
        }
    }

    detailsArray.forEach(d => {
        if (!d || d === 'ไม่มี' || d === '-') return;
        if (!healthSummary[category][d]) {
            healthSummary[category][d] = [];
        }
        healthSummary[category][d].push(nickname || 'ไม่ระบุชื่อเล่น');
    });
  };

  staffSnapshot.forEach(doc => {
    const data = doc.data();
    staffData.push({ id: doc.id, ...data });

    const nickname = data.nickname || data.firstName;

    // 1. Dietary Restrictions
    if (data.hasDietaryRestriction === 'มี') {
      if (data.dietaryRestriction) {
        addSummary('dietary', data.dietaryRestriction, nickname);
      }
      if (data.dietaryOther) {
        addSummary('dietary', data.dietaryOther, nickname);
      }
    }

    // 2. Food Allergies
    if (data.foodAllergyDetails) {
      addSummary('allergy', data.foodAllergyDetails, nickname);
    }

    // 3. Medical Conditions
    if (data.hasMedicalCondition === 'มี') {
      if (data.medicalConditionDetails) {
        addSummary('medical', data.medicalConditionDetails, nickname);
      }
    }
  });
  
  // 1. Create first CSV (All Staff)
  const staffCsv = convertToCSV(staffData);
  fs.writeFileSync('./staff_applicants_full.csv', staffCsv, 'utf8');
  console.log(`✅ ส่งออกไฟล์ Staff (ข้อมูลเต็ม) สำเร็จ! (${staffData.length} แถว) -> ./staff_applicants_full.csv`);

  // 2. Create second CSV (Summary)
  const summaryData = [];
  
  Object.keys(healthSummary.dietary).forEach(detail => {
      summaryData.push({
          'ประเภท': 'ข้อจำกัดด้านอาหาร',
          'รายละเอียด': detail,
          'จำนวนคน': healthSummary.dietary[detail].length,
          'รายชื่อ (ชื่อเล่น)': healthSummary.dietary[detail].join(', ')
      });
  });

  Object.keys(healthSummary.allergy).forEach(detail => {
      summaryData.push({
          'ประเภท': 'แพ้อาหาร',
          'รายละเอียด': detail,
          'จำนวนคน': healthSummary.allergy[detail].length,
          'รายชื่อ (ชื่อเล่น)': healthSummary.allergy[detail].join(', ')
      });
  });

  Object.keys(healthSummary.medical).forEach(detail => {
      summaryData.push({
          'ประเภท': 'โรคประจำตัว',
          'รายละเอียด': detail,
          'จำนวนคน': healthSummary.medical[detail].length,
          'รายชื่อ (ชื่อเล่น)': healthSummary.medical[detail].join(', ')
      });
  });

  if (summaryData.length > 0) {
      // Custom CSV export for summary to ensure exact column order
      const headers = ['ประเภท', 'รายละเอียด', 'จำนวนคน', 'รายชื่อ (ชื่อเล่น)'];
      const csvRows = [];
      csvRows.push(headers.map(h => `"${h}"`).join(','));
      summaryData.forEach(item => {
          const rowValues = headers.map(header => {
              const val = item[header];
              return `"${String(val).replace(/"/g, '""')}"`;
          });
          csvRows.push(rowValues.join(','));
      });
      // Add BOM for Excel UTF-8 support
      const summaryCsvString = '\ufeff' + csvRows.join('\r\n');
      fs.writeFileSync('./staff_health_summary.csv', summaryCsvString, 'utf8');
      console.log(`✅ ส่งออกไฟล์สรุปด้านสุขภาพสำเร็จ! (${summaryData.length} รายการ) -> ./staff_health_summary.csv`);
  } else {
      console.log(`ℹ️ ไม่มีข้อมูลข้อจำกัดด้านอาหารหรือโรคประจำตัว จึงไม่ได้สร้างไฟล์สรุป`);
  }
}

run();
