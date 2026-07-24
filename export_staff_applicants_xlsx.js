import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service Account Path
const serviceAccountPath = path.join(__dirname, 'local-scripts', 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key file not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Helper to format ISO timestamp into readable Thai string
function formatThaiDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const month = monthNames[d.getMonth()] || '';
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year} เวลา ${hours}:${minutes}:${seconds} น.`;
  } catch (e) {
    return isoString;
  }
}

// Column descriptions for Tab 5
const COLUMN_DESCRIPTIONS = {
  'ลำดับ': { name: 'ลำดับ', desc: 'ลำดับรายการที่' },
  'titlePrefix': { name: 'คำนำหน้าชื่อ', desc: 'คำนำหน้าชื่อ เช่น นาย, นางสาว, Mr., Ms.' },
  'firstName': { name: 'ชื่อจริง', desc: 'ชื่อจริงของผู้สมัครสตาฟฟ์' },
  'middleName': { name: 'ชื่อกลาง', desc: 'ชื่อกลาง (ถ้ามี)' },
  'lastName': { name: 'นามสกุล', desc: 'นามสกุลของผู้สมัครสตาฟฟ์' },
  'nickname': { name: 'ชื่อเล่น', desc: 'ชื่อเล่นของสตาฟฟ์' },
  'studentId': { name: 'รหัสนักศึกษา', desc: 'รหัสนักศึกษา 11 หลัก' },
  'year': { name: 'ชั้นปี', desc: 'ชั้นปีการศึกษา' },
  'department': { name: 'ภาควิชา/สาขา', desc: 'ภาควิชาที่ศึกษาอยู่' },
  'role1': { name: 'ฝ่าย/ตำแหน่ง (หลัก)', desc: 'ฝ่ายหรือตำแหน่งงานสตาฟฟ์อันดับที่ 1' },
  'role2': { name: 'ฝ่าย/ตำแหน่ง (รอง)', desc: 'ฝ่ายหรือตำแหน่งงานสตาฟฟ์อันดับที่ 2 (ถ้ามี)' },
  'phone': { name: 'เบอร์โทรศัพท์', desc: 'เบอร์โทรศัพท์ติดต่อ' },
  'email': { name: 'อีเมล', desc: 'อีเมลที่ใช้สำหรับติดต่อ' },
  'lineId': { name: 'LINE ID', desc: 'ไอดีไลน์สำหรับติดต่อกลุ่มงาน' },
  'hasDietaryRestriction': { name: 'มีข้อจำกัดอาหาร', desc: 'ระบุว่า "มี" หรือ "ไม่มี" ข้อจำกัดด้านอาหาร' },
  'dietaryRestriction': { name: 'ประเภทอาหารที่ไม่รับ', desc: 'ประเภทอาหารที่ไม่รับ เช่น ฮาลาล, มังสวิรัติ, แพ้อาหาร' },
  'foodAllergyDetails': { name: 'รายละเอียดการแพ้อาหาร', desc: 'ระบุชนิดอาหารที่แพ้โดยละเอียด' },
  'dietaryOther': { name: 'ข้อจำกัดอาหารอื่นๆ', desc: 'รายละเอียดอาหารที่ไม่รับเพิ่มเติม' },
  'hasMedicalCondition': { name: 'มีโรคประจำตัว', desc: 'ระบุว่า "มี" หรือ "ไม่มี" โรคประจำตัว' },
  'medicalConditionDetails': { name: 'รายละเอียดโรคประจำตัว', desc: 'ระบุชนิดโรคประจำตัวหรือยารักษาโดยละเอียด' },
  'staffStatus': { name: 'สถานะสตาฟฟ์', desc: 'สถานะการเป็นสตาฟฟ์ในระบบ' },
  'createdAt': { name: 'วันที่สมัคร', desc: 'วันเวลาที่ลงทะเบียนสมัครสตาฟฟ์' }
};

async function exportStaffApplicantsToExcel() {
  console.log(`
==================================================
📊 เริ่มการสร้างไฟล์ Excel ข้อมูลสตาฟฟ์ (Staff Applicants Export)
==================================================
⏳ กำลังดึงข้อมูลจากคอลเลกชัน 'staff_applicants'...
  `);

  const snap = await db.collection('staff_applicants').get();
  console.log(`✓ ดึงข้อมูลผู้สมัครสตาฟฟ์สำเร็จทั้งหมด ${snap.size} คน`);

  const wb = XLSX.utils.book_new();

  const allStaffRows = [];
  const allergyRows = [];
  const deptCounts = {};
  const role1Counts = {};

  snap.docs.forEach((docSnap, idx) => {
    const d = docSnap.data();

    // Clean up arrays/strings
    const dietaryArr = Array.isArray(d.dietaryRestriction) ? d.dietaryRestriction.join(', ') : (d.dietaryRestriction || '');
    const fullName = `${d.titlePrefix || ''} ${d.firstName || ''} ${d.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
    const dept = d.department || 'ไม่ระบุภาควิชา';

    // Count Depts
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;

    // Count Roles
    const r1 = d.role1 || 'ไม่ระบุฝ่าย';
    role1Counts[r1] = (role1Counts[r1] || 0) + 1;

    // Tab 1 Row (Ordered Columns)
    allStaffRows.push({
      'ลำดับ': idx + 1,
      'คำนำหน้า': d.titlePrefix || '',
      'ชื่อจริง': d.firstName || '',
      'ชื่อกลาง': d.middleName || '',
      'นามสกุล': d.lastName || '',
      'ชื่อเล่น': d.nickname || '',
      'รหัสนักศึกษา': d.studentId || '',
      'ชั้นปี': d.year || '',
      'ภาควิชา/สาขา': dept,
      'ฝ่าย/ตำแหน่ง (1)': d.role1 || '',
      'ฝ่าย/ตำแหน่ง (2)': d.role2 || '',
      'เบอร์โทรศัพท์': d.phone || '',
      'อีเมล': d.email || '',
      'LINE ID': d.lineId || '',
      'มีข้อจำกัดอาหาร': d.hasDietaryRestriction || 'ไม่มี',
      'ประเภทอาหารที่ไม่รับ': dietaryArr,
      'รายละเอียดแพ้อาหาร': d.foodAllergyDetails || '',
      'อาหารที่ไม่รับอื่นๆ': d.dietaryOther || '',
      'มีโรคประจำตัว': d.hasMedicalCondition || 'ไม่มี',
      'รายละเอียดโรคประจำตัว': d.medicalConditionDetails || '',
      'สถานะสตาฟฟ์': d.staffStatus || 'ACTIVE',
      'LINE DisplayName': d.line_displayName || '',
      'วันที่สมัคร (ไทย)': formatThaiDateTime(d.createdAt || d.updatedAt)
    });

    // Check if staff has Food Allergy or Medical Restriction
    const hasDiet = d.hasDietaryRestriction === 'มี' || !!d.foodAllergyDetails || !!d.dietaryOther || !!dietaryArr;
    const hasMed = d.hasMedicalCondition === 'มี' || !!d.medicalConditionDetails;

    if (hasDiet || hasMed) {
      allergyRows.push({
        'ลำดับ': allergyRows.length + 1,
        'รหัสนักศึกษา': d.studentId || '',
        'ชื่อ-นามสกุล': fullName,
        'ชื่อเล่น': d.nickname || '',
        'ภาควิชา/สาขา': dept,
        'ฝ่าย/ตำแหน่ง': d.role1 || '',
        'เบอร์โทรศัพท์': d.phone || '',
        'มีข้อจำกัดอาหาร': d.hasDietaryRestriction || (hasDiet ? 'มี' : 'ไม่มี'),
        'ประเภทอาหารที่ไม่รับ': dietaryArr,
        'รายละเอียดอาการแพ้อาหาร': d.foodAllergyDetails || d.dietaryOther || '-',
        'มีโรคประจำตัว': d.hasMedicalCondition || (hasMed ? 'มี' : 'ไม่มี'),
        'รายละเอียดโรคประจำตัว': d.medicalConditionDetails || '-'
      });
    }
  });

  // Sort Tab 1 by studentId or name
  allStaffRows.sort((a, b) => a['รหัสนักศึกษา'].localeCompare(b['รหัสนักศึกษา']));
  allStaffRows.forEach((r, i) => r['ลำดับ'] = i + 1);

  // ====================================================
  // Tab 1: รายชื่อสตาฟฟ์ทั้งหมด
  // ====================================================
  const ws1 = XLSX.utils.json_to_sheet(allStaffRows);
  ws1['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, 
    { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 35 }, { wch: 25 }, 
    { wch: 25 }, { wch: 15 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, 
    { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 16 }, { wch: 30 }, 
    { wch: 15 }, { wch: 25 }, { wch: 28 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'รายชื่อสตาฟฟ์ทั้งหมด');
  console.log(`✅ Tab 1: รายชื่อสตาฟฟ์ทั้งหมด (${allStaffRows.length} คน)`);

  // ====================================================
  // Tab 2: ข้อมูลแพ้อาหารและข้อจำกัดสุขภาพ
  // ====================================================
  allergyRows.sort((a, b) => a['ภาควิชา/สาขา'].localeCompare(b['ภาควิชา/สาขา']));
  allergyRows.forEach((r, i) => r['ลำดับ'] = i + 1);

  const ws2 = XLSX.utils.json_to_sheet(allergyRows);
  ws2['!cols'] = [
    { wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 35 }, 
    { wch: 22 }, { wch: 15 }, { wch: 16 }, { wch: 25 }, { wch: 35 }, 
    { wch: 16 }, { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'ข้อมูลแพ้อาหาร-สุขภาพสตาฟฟ์');
  console.log(`✅ Tab 2: ข้อมูลแพ้อาหาร-สุขภาพสตาฟฟ์ (${allergyRows.length} คน)`);

  // ====================================================
  // Tab 3: สรุปยอดแยกตามภาควิชา
  // ====================================================
  const deptSorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const totalStaff = allStaffRows.length;

  const deptSummaryRows = deptSorted.map(([dept, count], i) => ({
    'ลำดับ': i + 1,
    'ภาควิชา / สาขาวิชา': dept,
    'จำนวนสตาฟฟ์ (คน)': count,
    'สัดส่วนคิดเป็น (%)': `${((count / (totalStaff || 1)) * 100).toFixed(2)}%`
  }));

  deptSummaryRows.push({
    'ลำดับ': '-',
    'ภาควิชา / สาขาวิชา': 'รวมสตาฟฟ์ทั้งหมด',
    'จำนวนสตาฟฟ์ (คน)': totalStaff,
    'สัดส่วนคิดเป็น (%)': '100.00%'
  });

  const ws3 = XLSX.utils.json_to_sheet(deptSummaryRows);
  ws3['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'สรุปจำนวนแยกตามภาควิชา');
  console.log(`✅ Tab 3: สรุปจำนวนแยกตามภาควิชา (${deptSorted.length} ภาค, รวม ${totalStaff} คน)`);

  // ====================================================
  // Tab 4: สรุปยอดแยกตามฝ่าย/ตำแหน่ง
  // ====================================================
  const roleSorted = Object.entries(role1Counts).sort((a, b) => b[1] - a[1]);
  const roleSummaryRows = roleSorted.map(([role, count], i) => ({
    'ลำดับ': i + 1,
    'ฝ่าย / ตำแหน่งงาน (Role 1)': role,
    'จำนวนสตาฟฟ์ (คน)': count,
    'สัดส่วนคิดเป็น (%)': `${((count / (totalStaff || 1)) * 100).toFixed(2)}%`
  }));

  roleSummaryRows.push({
    'ลำดับ': '-',
    'ฝ่าย / ตำแหน่งงาน (Role 1)': 'รวมสตาฟฟ์ทั้งหมด',
    'จำนวนสตาฟฟ์ (คน)': totalStaff,
    'สัดส่วนคิดเป็น (%)': '100.00%'
  });

  const ws4 = XLSX.utils.json_to_sheet(roleSummaryRows);
  ws4['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'สรุปแยกตามฝ่ายงาน');
  console.log(`✅ Tab 4: สรุปแยกตามฝ่ายงาน (${roleSorted.length} ฝ่าย)`);

  // ====================================================
  // Tab 5: คำอธิบายคอลัมน์
  // ====================================================
  const descRows = Object.entries(COLUMN_DESCRIPTIONS).map(([key, item], i) => ({
    'ลำดับ': i + 1,
    'ชื่อคอลัมน์ (Field Name)': key,
    'ชื่อภาษาไทย': item.name,
    'คำอธิบายรายละเอียด': item.desc
  }));

  const ws5 = XLSX.utils.json_to_sheet(descRows);
  ws5['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 25 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'คำอธิบายคอลัมน์');
  console.log(`✅ Tab 5: คำอธิบายคอลัมน์ (${descRows.length} รายการ)`);

  // Output file
  const outputPath = './staff_applicants_export.xlsx';
  XLSX.writeFile(wb, outputPath);
  console.log(`
==================================================
🎉 บันทึกไฟล์ Excel สตาฟฟ์ทั้งหมดเรียบร้อยแล้ว!
👉 ไฟล์ถูกสร้างที่: ${outputPath}
==================================================
  `);
}

exportStaffApplicantsToExcel()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ เกิดข้อผิดพลาดในการ Export ข้อมูลสตาฟฟ์:", err);
    process.exit(1);
  });
