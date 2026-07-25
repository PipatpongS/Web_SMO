import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Map Group Identifiers
const GROUPS = ['DREAM', 'DESIGN', 'BUILD', 'BLOOM', 'BEYOND'];

function normalizeGroup(g) {
  if (!g) return 'UNASSIGNED';
  const str = String(g).trim().toUpperCase();
  if (str === '1' || str.includes('DREAM')) return 'DREAM';
  if (str === '2' || str.includes('DESIGN')) return 'DESIGN';
  if (str === '3' || str.includes('BUILD')) return 'BUILD';
  if (str === '4' || str.includes('BLOOM')) return 'BLOOM';
  if (str === '5' || str.includes('BEYOND')) return 'BEYOND';
  return 'UNASSIGNED';
}

async function runCheckinSummaryReport() {
  console.log('⏳ กำลังดึงข้อมูลสรุปยอดจาก Firebase Firestore...\n');

  const snapshot = await db.collection('users').get();

  const groupCounts = {
    DREAM: { checkedIn: 0, total: 0 },
    DESIGN: { checkedIn: 0, total: 0 },
    BUILD: { checkedIn: 0, total: 0 },
    BLOOM: { checkedIn: 0, total: 0 },
    BEYOND: { checkedIn: 0, total: 0 },
    UNASSIGNED: { checkedIn: 0, total: 0 }
  };

  let totalStudents = 0;
  let totalCheckedIn = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    // Checkin Status
    const isCheckedIn = !!(
      data.checkin_day1_morning ||
      data.checkin_day1_morning_timestamp ||
      data.checkin_day1_morning_by
    );

    const groupKey = normalizeGroup(data.group || data.Group);

    totalStudents++;
    groupCounts[groupKey].total++;

    if (isCheckedIn) {
      totalCheckedIn++;
      groupCounts[groupKey].checkedIn++;
    }
  });

  const totalNotCheckedIn = totalStudents - totalCheckedIn;
  const percentChecked = totalStudents > 0 ? ((totalCheckedIn / totalStudents) * 100).toFixed(1) : 0;

  console.log('====================================================================');
  console.log('📊 สรุปยอดการเช็คชื่อลงทะเบียน (วันที่ 1 รอบเช้า)');
  console.log('====================================================================');
  console.log(`👥 นักศึกษาทั้งหมด : ${totalStudents.toLocaleString()} คน`);
  console.log(`✅ เช็คชื่อแล้ว     : ${totalCheckedIn.toLocaleString()} คน (${percentChecked}%)`);
  console.log(`❌ ยังไม่ได้เช็คชื่อ : ${totalNotCheckedIn.toLocaleString()} คน (${(100 - percentChecked).toFixed(1)}%)`);
  console.log('--------------------------------------------------------------------\n');

  console.log('--------------------------------------------------------------------');
  console.log('📌 ยอดสรุปแยกตามกลุ่มกิจกรรม (5 กลุ่ม)');
  console.log('--------------------------------------------------------------------');

  const allGroupKeys = [...GROUPS, 'UNASSIGNED'];

  allGroupKeys.forEach((gKey, idx) => {
    const counts = groupCounts[gKey];
    const total = counts.total;
    const checked = counts.checkedIn;
    const remaining = total - checked;
    const pct = total > 0 ? ((checked / total) * 100).toFixed(1) : 0;

    const label = gKey === 'UNASSIGNED' ? 'ยังไม่ระบุกลุ่ม' : `กลุ่ม ${idx + 1}: ${gKey}`;
    
    console.log(
      `🔹 ${label.padEnd(22)} | รวม ${String(total).padStart(4)} คน | ✅ เช็คชื่อแล้ว ${String(checked).padStart(4)} คน (${pct.padStart(5)}%) | ❌ คงเหลือ ${String(remaining).padStart(4)} คน`
    );
  });

  console.log('====================================================================\n');
}

runCheckinSummaryReport().catch(err => console.error('❌ Error running checkin summary report:', err));
