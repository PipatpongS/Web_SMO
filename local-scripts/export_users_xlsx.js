import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { createRequire } from 'module';
import XLSX from 'xlsx';

const require = createRequire(import.meta.url);

// ลำดับคอลัมน์ที่เรียงไว้ให้ดูง่ายและเข้าใจ
const COLUMN_ORDER = [
  'titlePrefix',
  'firstName',
  'middleName',
  'lastName',
  'nationality',
  'studentIdStatus',
  'studentId',
  'department',
  'program',
  'email',
  'phone',
  'shirtSize',
  'joinActivity',
  'hasDietaryRestriction',
  'dietaryRestriction',
  'dietaryOther',
  'foodAllergyDetails',
  'hasMedicalCondition',
  'medicalConditionDetails',
  'pdpaConsent',
  'editCount',
  'note',
  'is_verified',
  'is_shirt_ordered',
  'shirt_received_at',
  'checkin_day1_morning',
  'checkin_day1_afternoon',
  'checkin_day2_morning',
  'checkin_day2_afternoon',
  'line_uid',
  'line_displayName',
  'line_pictureUrl',
  'qr_code',
  'short_code',
  'createdAt',
  'updatedAt',
];

// คำอธิบายแต่ละคอลัมน์ (Tab 2)
const COLUMN_DESCRIPTIONS = {
  'titlePrefix':              { thaiName: 'คำนำหน้าชื่อ',               description: 'คำนำหน้าชื่อ เช่น นาย, นางสาว, อื่นๆ' },
  'firstName':                { thaiName: 'ชื่อจริง',                   description: 'ชื่อจริง (ภาษาไทย หรือภาษาอังกฤษ)' },
  'middleName':               { thaiName: 'ชื่อกลาง',                   description: 'ชื่อกลาง (ถ้ามี)' },
  'lastName':                 { thaiName: 'นามสกุล',                    description: 'นามสกุล (ภาษาไทย หรือภาษาอังกฤษ)' },
  'nationality':              { thaiName: 'สัญชาติ',                    description: 'สัญชาติของผู้เข้าร่วม' },
  'studentIdStatus':          { thaiName: 'สถานะรหัสนักศึกษา',          description: 'สถานะการได้รับรหัสนักศึกษา เช่น "ได้รับรหัสนักศึกษาแล้ว", "ยังไม่ได้รับรหัสนักศึกษา"' },
  'studentId':                { thaiName: 'รหัสนักศึกษา',               description: 'รหัสนักศึกษา 11 หลัก ของมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี' },
  'department':               { thaiName: 'ภาควิชา/สาขา',              description: 'ภาควิชา หรือสาขาวิชาที่ศึกษาอยู่' },
  'program':                  { thaiName: 'โครงการ/หลักสูตร',           description: 'โครงการที่ศึกษา เช่น โครงการภาษาไทย, โครงการนานาชาติ' },
  'email':                    { thaiName: 'อีเมล',                      description: 'อีเมลที่ใช้สำหรับติดต่อ' },
  'phone':                    { thaiName: 'เบอร์โทรศัพท์',              description: 'เบอร์โทรศัพท์มือถือ' },
  'shirtSize':                { thaiName: 'ไซส์เสื้อ',                  description: 'ไซส์เสื้อที่เลือก เช่น S, M, L, XL, 2XL, 3XL' },
  'joinActivity':             { thaiName: 'ยืนยันเข้าร่วมกิจกรรม',     description: 'การยืนยันการเข้าร่วมกิจกรรม (เข้าร่วม / ไม่เข้าร่วม)' },
  'hasDietaryRestriction':    { thaiName: 'มีข้อจำกัดด้านอาหาร',        description: 'ระบุว่ามีข้อจำกัดด้านอาหารหรือไม่ (มี / ไม่มี)' },
  'dietaryRestriction':       { thaiName: 'ประเภทข้อจำกัดอาหาร',        description: 'ประเภทของข้อจำกัดอาหาร เช่น อิสลาม (ฮาลาล), แพ้อาหารบางชนิด, อื่นๆ (สามารถเลือกได้หลายข้อ)' },
  'dietaryOther':             { thaiName: 'ข้อจำกัดอาหารอื่นๆ',         description: 'รายละเอียดข้อจำกัดอาหารอื่นๆ นอกเหนือจากตัวเลือกที่มีให้ เช่น ไม่กินเนื้อวัว, ไม่กินผัก' },
  'foodAllergyDetails':       { thaiName: 'รายละเอียดการแพ้อาหาร',      description: 'รายละเอียดอาหารที่แพ้ เช่น แพ้อาหารทะเล, แพ้ถั่ว, แพ้นมวัว' },
  'hasMedicalCondition':      { thaiName: 'มีโรคประจำตัว',              description: 'ระบุว่ามีโรคประจำตัวหรือไม่ (มี / ไม่มี)' },
  'medicalConditionDetails':  { thaiName: 'รายละเอียดโรคประจำตัว',      description: 'รายละเอียดของโรคประจำตัว เช่น ภูมิแพ้, หอบหืด, G6PD, ธาลัสซีเมีย' },
  'pdpaConsent':              { thaiName: 'ยินยอม PDPA',                description: 'การยินยอมข้อตกลงคุ้มครองข้อมูลส่วนบุคคล (true = ยินยอม)' },
  'editCount':                { thaiName: 'จำนวนครั้งที่แก้ไข',         description: 'จำนวนครั้งที่ทำการแก้ไขข้อมูลผ่านระบบ (จำกัดสูงสุด 2 ครั้ง)' },
  'note':                     { thaiName: 'หมายเหตุ',                   description: 'บันทึกเพิ่มเติมจาก Admin หรือระบบ' },
  'is_verified':              { thaiName: 'สถานะการยืนยัน',             description: 'สถานะว่าข้อมูลผ่านการตรวจสอบแล้วหรือยัง (true = ยืนยันแล้ว)' },
  'is_shirt_ordered':         { thaiName: 'สถานะสั่งเสื้อ',             description: 'สถานะว่าสั่งเสื้อแล้วหรือยัง (true = สั่งแล้ว)' },
  'shirt_received_at':        { thaiName: 'วันที่รับเสื้อ',             description: 'วันเวลาที่รับเสื้อ (Timestamp)' },
  'checkin_day1_morning':     { thaiName: 'เช็คอินวันที่ 1 เช้า',       description: 'เวลาที่เช็คอินรอบเช้าวันที่ 1 (null = ยังไม่ได้เช็คอิน)' },
  'checkin_day1_afternoon':   { thaiName: 'เช็คอินวันที่ 1 บ่าย',       description: 'เวลาที่เช็คอินรอบบ่ายวันที่ 1 (null = ยังไม่ได้เช็คอิน)' },
  'checkin_day2_morning':     { thaiName: 'เช็คอินวันที่ 2 เช้า',       description: 'เวลาที่เช็คอินรอบเช้าวันที่ 2 (null = ยังไม่ได้เช็คอิน)' },
  'checkin_day2_afternoon':   { thaiName: 'เช็คอินวันที่ 2 บ่าย',       description: 'เวลาที่เช็คอินรอบบ่ายวันที่ 2 (null = ยังไม่ได้เช็คอิน)' },
  'line_uid':                 { thaiName: 'LINE User ID',               description: 'ค่า Unique ID ของบัญชี LINE ผู้ใช้' },
  'line_displayName':         { thaiName: 'ชื่อโปรไฟล์ LINE',           description: 'ชื่อที่แสดงบนโปรไฟล์ LINE ปัจจุบัน' },
  'line_pictureUrl':          { thaiName: 'URL รูปโปรไฟล์ LINE',        description: 'ลิงก์ URL รูปภาพโปรไฟล์ LINE' },
  'qr_code':                  { thaiName: 'QR Code',                    description: 'ข้อมูลสำหรับสร้าง QR Code (รูปแบบ: line_uid:studentId)' },
  'short_code':               { thaiName: 'Short Code',                 description: 'รหัสสั้น 4 หลัก สุ่มอัตโนมัติ สำหรับสแกนเข้างาน' },
  'createdAt':                { thaiName: 'วันที่ลงทะเบียน',            description: 'วันเวลาที่ส่งใบสมัครเข้าระบบครั้งแรก (ISO 8601 UTC)' },
  'updatedAt':                { thaiName: 'วันที่อัปเดตล่าสุด',         description: 'วันเวลาที่ข้อมูลได้รับการแก้ไขหรืออัปเดตล่าสุด (ISO 8601 UTC)' },
};

function formatValue(val) {
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') return val.toDate().toLocaleString('th-TH');
    return JSON.stringify(val);
  }
  return val;
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
    console.error('❌ Error: ไม่พบไฟล์คีย์ Firebase');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountFile);
  if (getApps().length === 0) initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  const wb = XLSX.utils.book_new();

  console.log('⏳ กำลังดึงข้อมูลผู้เข้าร่วม (users)...');
  const usersSnapshot = await db.collection('users').get();

  // Collect all data + extras for health sheet
  const allData = [];
  const deptCounts = {};
  // Health tracking
  const dietaryPersons = []; // คนที่มีข้อจำกัดด้านอาหาร
  const allergyPersons = []; // คนที่แพ้อาหาร
  const medicalPersons = []; // คนที่มีโรคประจำตัว
  const dietaryGrouped = {}; // Group by restriction type
  const allergyGrouped = {}; // Group by allergy detail
  const medicalGrouped = {}; // Group by medical condition

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.line_displayName === 'Rak') return;

    // Build ordered row
    const row = {};
    COLUMN_ORDER.forEach(key => {
      row[key] = formatValue(data[key]);
    });
    // Add any extra fields not in COLUMN_ORDER
    Object.keys(data).forEach(key => {
      if (!COLUMN_ORDER.includes(key)) {
        row[key] = formatValue(data[key]);
      }
    });
    allData.push(row);

    // Department count
    const dept = data.department || 'ไม่ระบุ';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;

    // Person info for health sheet
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const nickname = data.line_displayName || '';

    // --- Dietary restrictions ---
    if (data.hasDietaryRestriction === 'มี') {
      const restrictions = [];
      if (Array.isArray(data.dietaryRestriction) && data.dietaryRestriction.length > 0) {
        data.dietaryRestriction.forEach(r => restrictions.push(r));
      }
      if (data.dietaryOther && data.dietaryOther.trim()) {
        restrictions.push(data.dietaryOther.trim());
      }
      if (restrictions.length > 0) {
        dietaryPersons.push({ fullName, nickname, details: restrictions.join(', ') });
        restrictions.forEach(r => {
          if (!dietaryGrouped[r]) dietaryGrouped[r] = [];
          dietaryGrouped[r].push({ fullName, nickname });
        });
      }
    }

    // --- Food allergy ---
    if (data.foodAllergyDetails && data.foodAllergyDetails.trim()) {
      const detail = data.foodAllergyDetails.trim();
      allergyPersons.push({ fullName, nickname, details: detail });
      if (!allergyGrouped[detail]) allergyGrouped[detail] = [];
      allergyGrouped[detail].push({ fullName, nickname });
    }

    // --- Medical condition ---
    if (data.hasMedicalCondition === 'มี' && data.medicalConditionDetails && data.medicalConditionDetails.trim()) {
      const detail = data.medicalConditionDetails.trim();
      medicalPersons.push({ fullName, nickname, details: detail });
      if (!medicalGrouped[detail]) medicalGrouped[detail] = [];
      medicalGrouped[detail].push({ fullName, nickname });
    }
  });

  // ====================================================
  // Tab 1: ข้อมูลดิบทั้งหมด (เรียงคอลัมน์แล้ว)
  // ====================================================
  const wsRaw = XLSX.utils.json_to_sheet(allData);
  // กำหนดความกว้างคอลัมน์ให้เหมาะสม
  wsRaw['!cols'] = COLUMN_ORDER.map(key => {
    if (key === 'line_pictureUrl' || key === 'qr_code') return { wch: 30 };
    if (key === 'line_uid') return { wch: 45 };
    if (key === 'department') return { wch: 35 };
    if (key === 'email') return { wch: 30 };
    if (key === 'medicalConditionDetails' || key === 'foodAllergyDetails' || key === 'dietaryOther') return { wch: 35 };
    if (key === 'note') return { wch: 40 };
    return { wch: 18 };
  });
  XLSX.utils.book_append_sheet(wb, wsRaw, 'ข้อมูลผู้เข้าร่วม (ดิบ)');
  console.log(`✅ Tab 1: ข้อมูลดิบทั้งหมด (${allData.length} คน)`);

  // ====================================================
  // Tab 2: คำอธิบายคอลัมน์
  // ====================================================
  const descRows = COLUMN_ORDER.map((key, i) => ({
    'ลำดับ': i + 1,
    'ชื่อคอลัมน์ (Field Name)': key,
    'ชื่อภาษาไทย': COLUMN_DESCRIPTIONS[key]?.thaiName || '',
    'คำอธิบาย': COLUMN_DESCRIPTIONS[key]?.description || '',
  }));
  const wsDesc = XLSX.utils.json_to_sheet(descRows);
  wsDesc['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsDesc, 'คำอธิบายคอลัมน์');
  console.log(`✅ Tab 2: คำอธิบายคอลัมน์ (${descRows.length} รายการ)`);

  // ====================================================
  // Tab 3: แยกตามภาควิชา
  // ====================================================
  const deptSorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const deptRows = deptSorted.map(([dept, count]) => ({
    'ภาควิชา / สาขาวิชา': dept,
    'จำนวนคน': count,
  }));
  deptRows.push({ 'ภาควิชา / สาขาวิชา': 'รวมทั้งหมด', 'จำนวนคน': allData.length });
  const wsDept = XLSX.utils.json_to_sheet(deptRows);
  wsDept['!cols'] = [{ wch: 45 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsDept, 'สรุปภาควิชา');
  console.log(`✅ Tab 3: สรุปภาควิชา (${deptSorted.length} ภาค, รวม ${allData.length} คน)`);

  // ====================================================
  // Tab 4: สรุปข้อจำกัดด้านอาหารและโรคประจำตัว
  // ====================================================
  const healthRows = [];

  // --- Section header: ข้อจำกัดด้านอาหาร ---
  healthRows.push({ 'หมวด': '📋 ข้อจำกัดด้านอาหาร', 'รายละเอียด': '', 'จำนวนคน': '', 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  Object.keys(dietaryGrouped).sort().forEach(restriction => {
    const persons = dietaryGrouped[restriction];
    persons.forEach((p, idx) => {
      healthRows.push({
        'หมวด': idx === 0 ? 'ข้อจำกัดด้านอาหาร' : '',
        'รายละเอียด': idx === 0 ? restriction : '',
        'จำนวนคน': idx === 0 ? persons.length : '',
        'ชื่อ-นามสกุล': p.fullName,
        'ชื่อเล่น (LINE)': p.nickname,
      });
    });
  });
  // subtotal
  healthRows.push({ 'หมวด': '', 'รายละเอียด': 'รวมจำนวนคนที่มีข้อจำกัดด้านอาหาร', 'จำนวนคน': dietaryPersons.length, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  healthRows.push({ 'หมวด': '', 'รายละเอียด': '', 'จำนวนคน': '', 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });

  // --- Section header: แพ้อาหาร ---
  healthRows.push({ 'หมวด': '📋 แพ้อาหาร', 'รายละเอียด': '', 'จำนวนคน': '', 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  Object.keys(allergyGrouped).sort().forEach(allergy => {
    const persons = allergyGrouped[allergy];
    persons.forEach((p, idx) => {
      healthRows.push({
        'หมวด': idx === 0 ? 'แพ้อาหาร' : '',
        'รายละเอียด': idx === 0 ? allergy : '',
        'จำนวนคน': idx === 0 ? persons.length : '',
        'ชื่อ-นามสกุล': p.fullName,
        'ชื่อเล่น (LINE)': p.nickname,
      });
    });
  });
  // subtotal
  healthRows.push({ 'หมวด': '', 'รายละเอียด': 'รวมจำนวนคนที่แพ้อาหาร', 'จำนวนคน': allergyPersons.length, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  healthRows.push({ 'หมวด': '', 'รายละเอียด': '', 'จำนวนคน': '', 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });

  // --- Section header: โรคประจำตัว ---
  healthRows.push({ 'หมวด': '📋 โรคประจำตัว', 'รายละเอียด': '', 'จำนวนคน': '', 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  Object.keys(medicalGrouped).sort().forEach(med => {
    const persons = medicalGrouped[med];
    persons.forEach((p, idx) => {
      healthRows.push({
        'หมวด': idx === 0 ? 'โรคประจำตัว' : '',
        'รายละเอียด': idx === 0 ? med : '',
        'จำนวนคน': idx === 0 ? persons.length : '',
        'ชื่อ-นามสกุล': p.fullName,
        'ชื่อเล่น (LINE)': p.nickname,
      });
    });
  });
  // subtotal
  healthRows.push({ 'หมวด': '', 'รายละเอียด': 'รวมจำนวนคนที่มีโรคประจำตัว', 'จำนวนคน': medicalPersons.length, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  healthRows.push({ 'หมวด': '', 'รายละเอียด': '', 'จำนวนคน': '', 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });

  // Grand total
  // นับจำนวนคนที่มีข้อจำกัดอย่างน้อย 1 อย่าง (ไม่นับซ้ำ)
  const allHealthNames = new Set();
  dietaryPersons.forEach(p => allHealthNames.add(p.fullName));
  allergyPersons.forEach(p => allHealthNames.add(p.fullName));
  medicalPersons.forEach(p => allHealthNames.add(p.fullName));
  healthRows.push({ 'หมวด': '📊 สรุปรวม', 'รายละเอียด': 'จำนวนคนที่มีข้อจำกัดด้านอาหาร (ทุกประเภท)', 'จำนวนคน': dietaryPersons.length, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  healthRows.push({ 'หมวด': '',            'รายละเอียด': 'จำนวนคนที่แพ้อาหาร', 'จำนวนคน': allergyPersons.length, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  healthRows.push({ 'หมวด': '',            'รายละเอียด': 'จำนวนคนที่มีโรคประจำตัว', 'จำนวนคน': medicalPersons.length, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });
  healthRows.push({ 'หมวด': '',            'รายละเอียด': 'รวมคนที่มีข้อจำกัดทั้งหมด (ไม่นับซ้ำ)', 'จำนวนคน': allHealthNames.size, 'ชื่อ-นามสกุล': '', 'ชื่อเล่น (LINE)': '' });

  const wsHealth = XLSX.utils.json_to_sheet(healthRows);
  wsHealth['!cols'] = [{ wch: 22 }, { wch: 55 }, { wch: 12 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsHealth, 'สรุปข้อจำกัดสุขภาพ-อาหาร');
  console.log(`✅ Tab 4: สรุปข้อจำกัดสุขภาพ-อาหาร`);
  console.log(`   - ข้อจำกัดอาหาร: ${dietaryPersons.length} คน`);
  console.log(`   - แพ้อาหาร: ${allergyPersons.length} คน`);
  console.log(`   - โรคประจำตัว: ${medicalPersons.length} คน`);
  console.log(`   - รวมคนที่มีข้อจำกัด (ไม่ซ้ำ): ${allHealthNames.size} คน`);

  // ====================================================
  // บันทึกไฟล์
  // ====================================================
  const outputPath = './users_export.xlsx';
  XLSX.writeFile(wb, outputPath);
  console.log(`\n🎉 บันทึกไฟล์ Excel สำเร็จ! -> ${outputPath}`);

  process.exit(0);
}

run();
