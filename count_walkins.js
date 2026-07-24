import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

// Default Start Time from User's Screenshot: 2026-07-24T11:14:33.497+07:00
const DEFAULT_START_TIME = "2026-07-24T11:14:33.497+07:00";

async function countWalkins(startTimeInput) {
  const startTimeStr = startTimeInput || process.argv[2] || DEFAULT_START_TIME;
  const startTime = new Date(startTimeStr);

  console.log(`
==================================================
📊 สรุปยอดลงทะเบียนรอบหน้างาน (Walk-in Count Report)
--------------------------------------------------
⏱️  เวลาตั้งต้นที่เลือก: ${startTimeStr}
==================================================
🔍 กำลังดึงข้อมูลจาก Firestore...
  `);

  const usersSnap = await db.collection('users').get();
  
  const allWalkins = [];
  const inRangeWalkins = [];

  usersSnap.docs.forEach(docSnap => {
    const data = docSnap.data();
    
    // Walk-in identifier check
    const isWalkin = 
      data.note === 'รอบหน้างาน' ||
      !!data.walkin_status ||
      !!data.walkin_temp_short_code ||
      !!data.walkin_temp_qr;

    if (!isWalkin) return;

    // Determine timestamp
    const tStr = data.updatedAt || data.registeredAt || data.createdAt || data.walkin_approved_at || '1970-01-01T00:00:00.000Z';
    const tDate = new Date(tStr);

    const studentRecord = {
      docId: docSnap.id,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
      studentId: data.studentId || 'N/A',
      department: data.department || 'N/A',
      shortCode: data.walkin_temp_short_code || data.short_code || data.shortCode || 'N/A',
      status: data.walkin_status || (data.walkin_verified ? 'APPROVED' : 'PENDING_APPROVAL'),
      note: data.note || 'รอบหน้างาน',
      timestamp: tStr,
      timeDate: tDate
    };

    allWalkins.push(studentRecord);

    if (tDate >= startTime) {
      inRangeWalkins.push(studentRecord);
    }
  });

  // Sort in-range students by timestamp ascending
  inRangeWalkins.sort((a, b) => a.timeDate - b.timeDate);
  allWalkins.sort((a, b) => a.timeDate - b.timeDate);

  // Group by Status for inRange
  const approvedCount = inRangeWalkins.filter(s => s.status === 'APPROVED').length;
  const pendingCount = inRangeWalkins.filter(s => s.status !== 'APPROVED').length;

  // Group by Department for inRange
  const deptSummary = {};
  inRangeWalkins.forEach(s => {
    deptSummary[s.department] = (deptSummary[s.department] || 0) + 1;
  });

  console.log(`
==================================================
📈 สรุปผลการนับยอด (Walk-in Summary)
==================================================
🔸 จำนวน Walk-in ทั้งหมดในระบบ (ทุกช่วงเวลา): ${allWalkins.length} คน
🔹 จำนวน Walk-in ตั้งแต่เวลา ${startTimeStr} จนถึงปัจจุบัน: ${inRangeWalkins.length} คน
--------------------------------------------------
  ✅ อนุมัติแล้ว (APPROVED): ${approvedCount} คน
  ⏳ รอการอนุมัติ (PENDING):  ${pendingCount} คน
==================================================
  `);

  if (inRangeWalkins.length > 0) {
    console.log(`📋 รายชื่อนักศึกษาที่ลงทะเบียนรอบหน้างาน (${inRangeWalkins.length} คน):`);
    console.log(`--------------------------------------------------`);
    inRangeWalkins.forEach((s, idx) => {
      const statusBadge = s.status === 'APPROVED' ? '✅ APPROVED' : '⏳ PENDING ';
      console.log(`${String(idx + 1).padStart(2, ' ')}. [${statusBadge}] ${s.shortCode.padEnd(5, ' ')} | ${s.studentId} | ${s.name} (${s.department}) | ${s.timestamp}`);
    });
    console.log(`--------------------------------------------------`);

    console.log(`\n🏢 สรุปแยกตามภาควิชา (ช่วงเวลานี้):`);
    Object.entries(deptSummary).forEach(([dept, count]) => {
      console.log(`   • ${dept}: ${count} คน`);
    });
    console.log(`==================================================\n`);
  } else {
    console.log(`⚠️ ไม่พบนักศึกษาที่ลงทะเบียนรอบหน้างานในช่วงเวลาหลัง ${startTimeStr}`);
    console.log(`(จำนวน Walk-in ทั้งหมดสะสมก่อนหน้านี้มี ${allWalkins.length} คน)\n`);
  }
}

const inputTime = process.argv[2];
countWalkins(inputTime)
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Error counting walkins:", err);
    process.exit(1);
  });
