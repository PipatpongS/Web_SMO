import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const GROUP_NAMES = { 1: 'DREAM', 2: 'DESIGN', 3: 'BUILD', 4: 'BLOOM', 5: 'BEYOND' };

async function main() {
  const uid = 'U639762d7e2dc60e6f184700fc9de7aa7'; // คุณพิพั ทรัพย์สิน W-AI37
  console.log(`🚀 กำลังอนุมัติการลงทะเบียน Walk-in ให้คุณ พิพั ทรัพย์สิน (DocId: ${uid})...\n`);

  const uDoc = await db.collection('users').doc(uid).get();
  if (!uDoc.exists) {
    console.error('❌ ไม่พบ Document');
    return;
  }

  const data = uDoc.data();

  // Balance group selection
  const isForeigner = data.nationality && !['ไทย','TH','THAI','Thai'].includes(data.nationality.trim());
  const allSnap = await db.collection('users').get();
  const groupCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allSnap.forEach(d => {
    const g = d.data().group;
    if (g) {
      const gNum = parseInt(g) || Object.keys(GROUP_NAMES).find(k => GROUP_NAMES[k] === String(g).toUpperCase());
      if (gNum && groupCounts[gNum] !== undefined) groupCounts[gNum]++;
    }
  });

  const allowedGroups = isForeigner ? [1, 2] : [1, 2, 3, 4, 5];
  let minCount = Infinity;
  let assignedGroup = 1;
  for (const g of allowedGroups) {
    if (groupCounts[g] < minCount) {
      minCount = groupCounts[g];
      assignedGroup = g;
    }
  }

  const assignedGroupName = GROUP_NAMES[assignedGroup];
  const approvedAt = new Date().toISOString();

  const updateFields = {
    walkin_status: 'APPROVED',
    walkin_verified: true,
    group: assignedGroupName,
    Group: assignedGroupName,
    status: 'APPROVED',
    walkin_approved_at: approvedAt,
    walkin_approved_by_staff_name: 'Admin Direct CLI',
    walkin_approved_by_staff_uid: 'ADMIN_DIRECT',
    updatedAt: approvedAt
  };

  await db.collection('users').doc(uid).update(updateFields);

  // Add audit log
  await db.collection('staff_access_logs').add({
    timestamp: approvedAt,
    event: 'WALKIN_APPROVED_AND_ASSIGNED_GROUP',
    student_doc_id: uid,
    student_id: data.studentId || '',
    student_name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    assigned_group: assignedGroup,
    assigned_group_name: assignedGroupName,
    staff_line_uid: 'ADMIN_DIRECT',
    staff_name: 'Admin Direct CLI'
  });

  console.log(`==================================================`);
  console.log(`✅ อนุมัติสำเร็จเรียบร้อยแล้ว!`);
  console.log(`   นักศึกษา: ${data.firstName} ${data.lastName}`);
  console.log(`   รหัสยืนยัน: W-AI37`);
  console.log(`   กลุ่มกิจกรรมที่ได้รับ: กลุ่ม ${assignedGroupName} (กลุ่ม ${assignedGroup})`);
  console.log(`==================================================`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
