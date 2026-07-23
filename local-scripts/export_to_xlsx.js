import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { createRequire } from 'module';
import XLSX from 'xlsx';

const require = createRequire(import.meta.url);

async function run() {
  let serviceAccountFile = './serviceAccountKey.json';
  
  if (!fs.existsSync(serviceAccountFile)) {
    try {
      const files = fs.readdirSync('.');
      const adminSdkFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      if (adminSdkFile) {
        serviceAccountFile = `./${adminSdkFile}`;
      }
    } catch (e) {}
  }
  
  if (!fs.existsSync(serviceAccountFile)) {
    console.error('❌ Error: ไม่พบไฟล์คีย์ Firebase (serviceAccountKey.json หรือไฟล์ firebase-adminsdk-*.json)');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountFile);

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    const db = getFirestore();

    const wb = XLSX.utils.book_new();

    // ----------------------------------------------------
    // 1. ดึงและประมวลผลข้อมูลผู้เข้าร่วม (users)
    // ----------------------------------------------------
    console.log('⏳ กำลังดึงข้อมูลผู้เข้าร่วม (users)...');
    const usersSnapshot = await db.collection('users').get();
    const usersData = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      // กรองแอคเคาท์ทดสอบออก
      if (data.line_displayName === 'Rak') return;
      
      // แปลงข้อมูลพิเศษเพื่อให้อยู่ในรูปที่เขียนลง Excel ได้ง่าย
      const formatted = { id: doc.id };
      Object.keys(data).forEach(key => {
        let val = data[key];
        if (val === undefined || val === null) {
          formatted[key] = '';
        } else if (Array.isArray(val)) {
          formatted[key] = val.join(', ');
        } else if (typeof val === 'object') {
          if (typeof val.toDate === 'function') {
            formatted[key] = val.toDate().toLocaleString('th-TH');
          } else {
            formatted[key] = JSON.stringify(val);
          }
        } else {
          formatted[key] = val;
        }
      });
      usersData.push(formatted);
    });

    const wsUsers = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(wb, wsUsers, 'ผู้เข้าร่วม (Participants)');
    console.log(`✅ ประมวลผลข้อมูลผู้เข้าร่วมสำเร็จ (${usersData.length} คน)`);

    // ----------------------------------------------------
    // 2. ดึงและประมวลผลข้อมูลผู้สมัคร Staff
    // ----------------------------------------------------
    console.log('⏳ กำลังดึงข้อมูลผู้สมัคร Staff (staff_applicants)...');
    const staffSnapshot = await db.collection('staff_applicants').get();
    const staffData = [];
    
    const roleGroups = {};
    const healthSummary = {
      dietary: {},
      allergy: {},
      medical: {}
    };

    const addHealthSummary = (category, detail, nickname) => {
      if (!detail) return;
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
      // กรองแอคเคาท์ทดสอบออก
      if (data.line_displayName === 'Rak') return;

      const nickname = data.nickname || data.firstName || 'ไม่ระบุชื่อ';
      const role = data.role1 || 'ไม่ระบุฝ่าย';

      // จัดการกับข้อมูลเพื่อบันทึกลงชีตข้อมูลดิบ Staff
      const formatted = { id: doc.id };
      Object.keys(data).forEach(key => {
        let val = data[key];
        if (val === undefined || val === null) {
          formatted[key] = '';
        } else if (Array.isArray(val)) {
          formatted[key] = val.join(', ');
        } else if (typeof val === 'object') {
          if (typeof val.toDate === 'function') {
            formatted[key] = val.toDate().toLocaleString('th-TH');
          } else {
            formatted[key] = JSON.stringify(val);
          }
        } else {
          formatted[key] = val;
        }
      });
      staffData.push(formatted);

      // จัดเก็บชื่อเล่นแยกแผนก
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(nickname.trim());

      // สรุปข้อมูลด้านสุขภาพ
      if (data.hasDietaryRestriction === 'มี') {
        if (data.dietaryRestriction) addHealthSummary('dietary', data.dietaryRestriction, nickname);
        if (data.dietaryOther) addHealthSummary('dietary', data.dietaryOther, nickname);
      }
      if (data.foodAllergyDetails) {
        addHealthSummary('allergy', data.foodAllergyDetails, nickname);
      }
      if (data.hasMedicalCondition === 'มี') {
        if (data.medicalConditionDetails) addHealthSummary('medical', data.medicalConditionDetails, nickname);
      }
    });

    const wsStaff = XLSX.utils.json_to_sheet(staffData);
    XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff ทั้งหมด (ดิบ)');
    console.log(`✅ ประมวลผลข้อมูล Staff สำเร็จ (${staffData.length} คน)`);

    // ----------------------------------------------------
    // 3. สร้างตารางสรุปแผนกและชื่อเล่น Staff
    // ----------------------------------------------------
    const roles = Object.keys(roleGroups).sort();
    const maxRows = Math.max(...roles.map(r => roleGroups[r].length));

    const staffRolesRows = [];
    for (let i = 0; i < maxRows; i++) {
      const row = {};
      roles.forEach(role => {
        const count = roleGroups[role].length;
        row[`${role} (${count} คน)`] = roleGroups[role][i] || '';
      });
      staffRolesRows.push(row);
    }

    const wsStaffRoles = XLSX.utils.json_to_sheet(staffRolesRows);
    XLSX.utils.book_append_sheet(wb, wsStaffRoles, 'สรุปฝ่าย Staff (แยกเซลล์)');
    console.log('✅ ประมวลผลชีตสรุปฝ่าย Staff สำเร็จ');

    // ----------------------------------------------------
    // 4. สร้างชีตสรุปข้อมูลด้านสุขภาพ/อาหาร Staff
    // ----------------------------------------------------
    const healthRows = [];
    
    // อาหารเจ/ฮาลาล
    Object.keys(healthSummary.dietary).forEach(detail => {
      healthRows.push({
        'ประเภท': 'ข้อจำกัดด้านอาหาร',
        'รายละเอียด': detail,
        'จำนวนคน': healthSummary.dietary[detail].length,
        'รายชื่อ (ชื่อเล่น)': healthSummary.dietary[detail].join(', ')
      });
    });

    // แพ้อาหาร
    Object.keys(healthSummary.allergy).forEach(detail => {
      healthRows.push({
        'ประเภท': 'แพ้อาหาร',
        'รายละเอียด': detail,
        'จำนวนคน': healthSummary.allergy[detail].length,
        'รายชื่อ (ชื่อเล่น)': healthSummary.allergy[detail].join(', ')
      });
    });

    // โรคประจำตัว
    Object.keys(healthSummary.medical).forEach(detail => {
      healthRows.push({
        'ประเภท': 'โรคประจำตัว',
        'รายละเอียด': detail,
        'จำนวนคน': healthSummary.medical[detail].length,
        'รายชื่อ (ชื่อเล่น)': healthSummary.medical[detail].join(', ')
      });
    });

    const wsHealth = XLSX.utils.json_to_sheet(healthRows);
    XLSX.utils.book_append_sheet(wb, wsHealth, 'สรุปสุขภาพ Staff');
    console.log('✅ ประมวลผลชีตสรุปสุขภาพ Staff สำเร็จ');

    // ----------------------------------------------------
    // 5. บันทึกเป็นไฟล์ Excel
    // ----------------------------------------------------
    const outputPath = './smo_database_export.xlsx';
    XLSX.writeFile(wb, outputPath);
    console.log(`\n🎉 บันทึกไฟล์ Excel สำเร็จ! -> ${outputPath}`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

run();
