import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service Account Path in local-scripts
const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key file not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Helper for Thai ISO timestamp (+07:00)
function getThaiISOString() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thaiTime = new Date(utc + (3600000 * 7));
  const year = thaiTime.getFullYear();
  const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const day = String(thaiTime.getDate()).padStart(2, '0');
  const hours = String(thaiTime.getHours()).padStart(2, '0');
  const minutes = String(thaiTime.getMinutes()).padStart(2, '0');
  const seconds = String(thaiTime.getSeconds()).padStart(2, '0');
  const millis = String(thaiTime.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}+07:00`;
}

// Search for student record by code or candidate variants
async function findStudent(code) {
  const cleanCode = code.trim().toUpperCase();
  const candidateCodes = [cleanCode];

  if (cleanCode.includes('I')) {
    candidateCodes.push(cleanCode.replace(/I/g, 'L'));
    candidateCodes.push(cleanCode.replace(/I/g, '1'));
  }
  if (cleanCode.includes('L')) {
    candidateCodes.push(cleanCode.replace(/L/g, 'I'));
    candidateCodes.push(cleanCode.replace(/L/g, '1'));
  }
  if (cleanCode.includes('1')) {
    candidateCodes.push(cleanCode.replace(/1/g, 'I'));
    candidateCodes.push(cleanCode.replace(/1/g, 'L'));
  }

  for (const candidate of candidateCodes) {
    // 1. Fast lookup: used_short_codes collection
    try {
      const scDoc = await db.collection('used_short_codes').doc(candidate).get();
      if (scDoc.exists && scDoc.data()?.uid) {
        const uid = scDoc.data().uid;
        const uDoc = await db.collection('users').doc(uid).get();
        if (uDoc.exists) return { id: uDoc.id, data: uDoc.data(), matchedCode: candidate };
      }
    } catch (err) {}

    // 2. Query walkin_temp_short_code
    try {
      const q1 = await db.collection('users').where('walkin_temp_short_code', '==', candidate).limit(1).get();
      if (!q1.empty) return { id: q1.docs[0].id, data: q1.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 3. Query short_code
    try {
      const q2 = await db.collection('users').where('short_code', '==', candidate).limit(1).get();
      if (!q2.empty) return { id: q2.docs[0].id, data: q2.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 4. Query shortCode
    try {
      const q3 = await db.collection('users').where('shortCode', '==', candidate).limit(1).get();
      if (!q3.empty) return { id: q3.docs[0].id, data: q3.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 5. Query studentId
    try {
      const q4 = await db.collection('users').where('studentId', '==', candidate).limit(1).get();
      if (!q4.empty) return { id: q4.docs[0].id, data: q4.docs[0].data(), matchedCode: candidate };
    } catch (err) {}

    // 6. Direct docId
    try {
      const uDoc = await db.collection('users').doc(candidate).get();
      if (uDoc.exists) return { id: uDoc.id, data: uDoc.data(), matchedCode: candidate };
    } catch (err) {}
  }

  return null;
}

const targetShortCodes = [
  "XD39", "GH32", "MB17", "MQ81", "ZC49", "SZ47", "BH28", "YR26", 
  "PD80", "CB31", "YG84", "GT58", "GM13", "HV35", "OC14", "JJ90", 
  "XI43", "QL89", "LD71", "VQ14", "TK22", "LK37", "UK53", "XB44", 
  "SS65", "CM99", "ZR63", "PH39"
];

async function runBatchApproveAndPickup() {
  console.log(`
==================================================
🚀 เริ่มกระบวนการอนุมัติ & ยืนยันการรับเสื้อ (Batch Approve & Shirt Checkin)
--------------------------------------------------
📋 รหัสทั้งหมดที่จะประมวลผล: ${targetShortCodes.length} รหัส
==================================================
  `);

  const successList = [];
  const failedList = [];

  for (let i = 0; i < targetShortCodes.length; i++) {
    const rawCode = targetShortCodes[i];
    console.log(`[${i + 1}/${targetShortCodes.length}] กำลังค้นหาและประมวลผลรหัส: "${rawCode}"...`);

    try {
      const match = await findStudent(rawCode);

      if (!match) {
        console.error(`  ❌ ไม่พบข้อมูลนักศึกษาสำหรับรหัส "${rawCode}"`);
        failedList.push({ code: rawCode, reason: 'ไม่พบข้อมูลใน Firestore (Not Found)' });
        continue;
      }

      const docId = match.id;
      const data = match.data;
      const matchedCode = match.matchedCode;
      const timestamp = getThaiISOString();

      const studentName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
      const studentId = data.studentId || 'N/A';
      const department = data.department || 'N/A';
      const shirtSize = data.shirtSize || data.shirt_size || 'M';

      // Payload for both Walk-in Approval & Shirt Pickup
      const updatePayload = {
        // Walk-in Approval fields
        walkin_status: 'APPROVED',
        walkin_verified: true,
        walkin_approved_at: timestamp,
        walkin_approved_by_staff_name: 'Admin CLI',
        walkin_approved_by_staff_uid: 'ADMIN_CLI',

        // Shirt Pickup Confirmation fields
        shirt_received_at: timestamp,
        shirt_received_by_staff_uid: 'ADMIN_CLI',
        shirt_received_by_staff_name: 'Admin CLI',
        shirt_received_by_staff_pic: '',
        search_method: 'ADMIN_CLI_BATCH',
        shirt_size_received: shirtSize,
        is_shirt_size_changed: false,

        updatedAt: timestamp
      };

      // Perform Update in users collection
      await db.collection('users').doc(docId).update(updatePayload);

      // Auto-sync used_short_codes map
      try {
        if (matchedCode.length === 4) {
          await db.collection('used_short_codes').doc(matchedCode).set({
            uid: docId,
            timestamp: timestamp
          }, { merge: true });
        }
      } catch (e) {}

      // Write staff access logs (Walk-in Approval Audit Log)
      try {
        await db.collection('staff_access_logs').add({
          timestamp: timestamp,
          event: 'WALKIN_APPROVED_VIA_ADMIN_CLI',
          student_doc_id: docId,
          student_id: studentId,
          student_name: studentName,
          staff_line_uid: 'ADMIN_CLI',
          staff_name: 'Admin CLI',
          search_code: matchedCode
        });
      } catch (e) {}

      // Write shirt checkin logs (Shirt Pickup Audit Log)
      try {
        await db.collection('shirt_checkin_logs').add({
          log_id: `LOG_${Date.now()}_${i}`,
          student_id: studentId,
          student_name: studentName,
          department: department,
          search_method: 'ADMIN_CLI_BATCH',
          shirtSize: shirtSize,
          shirt_size_received: shirtSize,
          is_size_changed: false,
          action: 'CHECKIN_SHIRT',
          timestamp: timestamp,
          staff_line_uid: 'ADMIN_CLI',
          staff_display_name: 'Admin CLI'
        });
      } catch (e) {}

      console.log(`  ✅ สำเร็จ: ${studentName} (${studentId}) | รหัส: ${matchedCode} | ไซส์เสื้อ: ${shirtSize}`);
      successList.push({
        code: rawCode,
        matchedCode,
        studentId,
        studentName,
        department,
        shirtSize,
        docId
      });

    } catch (err) {
      console.error(`  ❌ เกิดข้อผิดพลาดกับรหัส "${rawCode}":`, err.message);
      failedList.push({ code: rawCode, reason: err.message });
    }
  }

  // Summary Report Output
  console.log(`
==================================================
📊 สรุปผลการประมวลผลอนุมัติ & รับเสื้อ (BATCH SUMMARY)
==================================================
จำนวนทั้งหมดที่ส่งมา: ${targetShortCodes.length} คน
✅ ประมวลผลสำเร็จ:     ${successList.length} คน
❌ ไม่สำเร็จ:            ${failedList.length} คน
==================================================
  `);

  if (successList.length > 0) {
    console.log(`📋 รายชื่อที่อนุมัติ & ยืนยันการรับเสื้อสำเร็จ (${successList.length} คน):`);
    console.log(`--------------------------------------------------------------------------------`);
    successList.forEach((item, idx) => {
      console.log(`${String(idx + 1).padStart(2, ' ')}. [${item.matchedCode.padEnd(4, ' ')}] ${item.studentId} | ${item.studentName} (${item.department}) | รับเสื้อไซส์: ${item.shirtSize}`);
    });
    console.log(`--------------------------------------------------------------------------------`);
  }

  if (failedList.length > 0) {
    console.log(`\n❌ รายชื่อที่ไม่สำเร็จ (${failedList.length} คน):`);
    console.log(`--------------------------------------------------------------------------------`);
    failedList.forEach((item, idx) => {
      console.log(`${String(idx + 1).padStart(2, ' ')}. [${item.code}] สาเหตุ: ${item.reason}`);
    });
    console.log(`--------------------------------------------------------------------------------`);
  } else {
    console.log(`🎉 ทุกรายการได้รับการอนุมัติและยืนยันการรับเสื้อสำเร็จ 100% ไม่มีรายการล้มเหลว!\n`);
  }
}

runBatchApproveAndPickup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Fatal batch execution error:", err);
    process.exit(1);
  });
