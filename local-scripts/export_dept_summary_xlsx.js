import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Path to Service Account JSON
const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ ไม่พบไฟล์ Service Account ที่: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

function formatTime(val) {
  if (!val) return '-';
  if (typeof val === 'string' && val.includes('T')) {
    const timePart = val.split('T')[1] || '';
    return timePart.replace(/\.\d+\+.*$/, '').replace(/\+.*$/, '');
  }
  return String(val);
}

async function exportDeptSummaryXlsx() {
  console.log('⏳ กำลังดึงข้อมูลจาก Firebase Firestore Collection "users"...\n');

  const snapshot = await db.collection('users').get();

  const deptMap = {};
  const allStudentsList = [];

  let totalAll = 0;
  let totalCheckedInAll = 0;
  let totalNotCheckedInAll = 0;

  snapshot.forEach((doc, idx) => {
    const data = doc.data();

    // Raw Department
    let dept = (data.department || '').trim();
    if (!dept) dept = 'ยังไม่ระบุภาควิชา';

    // Checkin Status
    const isCheckedIn = !!(
      data.checkin_day1_morning ||
      data.checkin_day1_morning_timestamp ||
      data.checkin_day1_morning_by
    );

    const checkinTime = data.checkin_day1_morning_timestamp || data.checkin_day1_morning || '';
    const checkinBy = data.checkin_day1_morning_by || '';

    // Initialize dept counter
    if (!deptMap[dept]) {
      deptMap[dept] = {
        total: 0,
        checkedIn: 0,
        notCheckedIn: 0,
        students: []
      };
    }

    deptMap[dept].total++;
    totalAll++;

    if (isCheckedIn) {
      deptMap[dept].checkedIn++;
      totalCheckedInAll++;
    } else {
      deptMap[dept].notCheckedIn++;
      totalNotCheckedInAll++;
    }

    const studentObj = {
      no: idx + 1,
      studentId: data.studentId || data.id || '-',
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.displayName || 'ไม่ระบุชื่อ',
      department: dept,
      program: data.program || '-',
      group: data.group || data.Group || '-',
      shortCode: data.short_code || data.shortCode || data.walkin_temp_short_code || '-',
      phone: data.phone || data.tel || '-',
      status: isCheckedIn ? 'เช็คชื่อแล้ว' : 'ยังไม่ได้เช็คชื่อ',
      checkinTime: formatTime(checkinTime),
      checkinBy: checkinBy || '-'
    };

    deptMap[dept].students.push(studentObj);
    allStudentsList.push(studentObj);
  });

  // Build Sheet 1: Department Summary Data
  const summaryRows = [];
  const sortedDepts = Object.keys(deptMap).sort((a, b) => deptMap[b].total - deptMap[a].total);

  sortedDepts.forEach((dName, i) => {
    const d = deptMap[dName];
    const pct = d.total > 0 ? ((d.checkedIn / d.total) * 100).toFixed(1) : '0.0';
    summaryRows.push({
      'ลำดับ (No.)': i + 1,
      'ภาควิชา (Department)': dName,
      'จำนวนลงทะเบียนทั้งหมด (Total)': d.total,
      'เช็คชื่อแล้ว (Checked-in)': d.checkedIn,
      'ยังไม่ได้เช็คชื่อ (Not Checked-in)': d.notCheckedIn,
      'สัดส่วนการเข้างาน (%)': `${pct}%`
    });
  });

  // Total Summary Row
  const totalPct = totalAll > 0 ? ((totalCheckedInAll / totalAll) * 100).toFixed(1) : '0.0';
  summaryRows.push({
    'ลำดับ (No.)': 'รวมทั้งหมด',
    'ภาควิชา (Department)': 'TOTAL ALL',
    'จำนวนลงทะเบียนทั้งหมด (Total)': totalAll,
    'เช็คชื่อแล้ว (Checked-in)': totalCheckedInAll,
    'ยังไม่ได้เช็คชื่อ (Not Checked-in)': totalNotCheckedInAll,
    'สัดส่วนการเข้างาน (%)': `${totalPct}%`
  });

  // Build Sheet 2: All Students Detail Data
  const detailRows = allStudentsList.map((s, i) => ({
    'ลำดับ': i + 1,
    'รหัสนักศึกษา': s.studentId,
    'ชื่อ-นามสกุล': s.name,
    'ภาควิชา': s.department,
    'โครงการ': s.program,
    'กลุ่มกิจกรรม': s.group,
    'Short Code': s.shortCode,
    'เบอร์โทรศัพท์': s.phone,
    'สถานะเช็คชื่อ': s.status,
    'เวลาเช็คชื่อ': s.checkinTime,
    'ผู้เช็คชื่อให้': s.checkinBy
  }));

  // Create Workbook
  const wb = XLSX.utils.book_new();

  // Create Worksheets
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);

  // Set column widths for Summary
  wsSummary['!cols'] = [
    { wch: 12 }, // ลำดับ
    { wch: 45 }, // ภาควิชา
    { wch: 30 }, // ลงทะเบียนทั้งหมด
    { wch: 25 }, // เช็คชื่อแล้ว
    { wch: 30 }, // ยังไม่ได้เช็คชื่อ
    { wch: 22 }  // %
  ];

  // Set column widths for Detail
  wsDetail['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 15 }, // รหัสนักศึกษา
    { wch: 30 }, // ชื่อ-นามสกุล
    { wch: 40 }, // ภาควิชา
    { wch: 25 }, // โครงการ
    { wch: 15 }, // กลุ่มกิจกรรม
    { wch: 12 }, // Short Code
    { wch: 15 }, // เบอร์โทรศัพท์
    { wch: 15 }, // สถานะเช็คชื่อ
    { wch: 15 }, // เวลาเช็คชื่อ
    { wch: 20 }  // ผู้เช็คชื่อให้
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปยอดแยกตามภาควิชา');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'รายชื่อนักศึกษาทั้งหมด');

  // Export File
  const outputFileName = `สรุปยอดลงทะเบียนแยกรายภาควิชา_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const outputPath = path.join(__dirname, outputFileName);
  const rootOutputPath = path.join(rootDir, outputFileName);

  XLSX.writeFile(wb, outputPath);
  XLSX.writeFile(wb, rootOutputPath);

  console.log('====================================================================');
  console.log('📊 สรุปรายงานยอดผู้ลงทะเบียนแยกตามภาควิชา (Collection: users)');
  console.log('====================================================================');
  console.log(`👥 นักศึกษาลงทะเบียนรวมทั้งหมด : ${totalAll.toLocaleString()} คน`);
  console.log(`✅ เช็คชื่อเข้างานแล้ว       : ${totalCheckedInAll.toLocaleString()} คน (${totalPct}%)`);
  console.log(`❌ ยังไม่ได้เช็คชื่อ           : ${totalNotCheckedInAll.toLocaleString()} คน`);
  console.log('--------------------------------------------------------------------\n');

  console.log('📌 สรุปยอดแยกตามภาควิชา (เรียงตามจำนวนผู้ลงทะเบียนจากมากไปน้อย):');
  console.log('--------------------------------------------------------------------------------------------------------');
  console.log(`| ${'ลำดับ'.padEnd(5)} | ${'ภาควิชา'.padEnd(42)} | ${'ลงทะเบียนทั้งหมด'.padStart(16)} | ${'เช็คชื่อแล้ว'.padStart(12)} | ${'คงเหลือ'.padStart(10)} | ${'สัดส่วน'.padStart(8)} |`);
  console.log('--------------------------------------------------------------------------------------------------------');

  sortedDepts.forEach((dName, i) => {
    const d = deptMap[dName];
    const pct = d.total > 0 ? ((d.checkedIn / d.total) * 100).toFixed(1) : '0.0';
    console.log(
      `| ${String(i + 1).padEnd(5)} | ${dName.padEnd(42)} | ${String(d.total).padStart(16)} | ${String(d.checkedIn).padStart(12)} | ${String(d.notCheckedIn).padStart(10)} | ${(pct + '%').padStart(8)} |`
    );
  });

  console.log('--------------------------------------------------------------------------------------------------------');
  console.log(
    `| ${'รวม'.padEnd(5)} | ${'TOTAL ALL'.padEnd(42)} | ${String(totalAll).padStart(16)} | ${String(totalCheckedInAll).padStart(12)} | ${String(totalNotCheckedInAll).padStart(10)} | ${(totalPct + '%').padStart(8)} |`
  );
  console.log('================================================================----------------------------------------\n');

  console.log(`📁 สร้างไฟล์ Excel สรุปยอดเรียบร้อยแล้ว:`);
  console.log(`   👉 ${outputPath}`);
  console.log(`   👉 ${rootOutputPath}\n`);
}

exportDeptSummaryXlsx().catch(err => console.error('❌ Error exporting dept summary:', err));
