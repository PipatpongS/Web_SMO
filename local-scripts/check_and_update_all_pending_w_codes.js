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

// Helper to generate W- prefixed unique code
async function generateUniqueTempCode(db, baseSeed) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let attempt = 0;

  while (true) {
    const str = baseSeed + (attempt > 0 ? `_${attempt}` : '');
    let h1 = 0, h2 = 0;
    for (let i = 0; i < str.length; i++) {
      h1 = (h1 * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
      h2 = (h2 * 37 + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    h1 = Math.abs(h1);
    h2 = Math.abs(h2);

    const code = 'W-' + letters[h1 % 26] + letters[(h1 >> 5) % 26] + numbers[h2 % 10] + numbers[(h2 >> 4) % 10];

    const ref = db.collection('used_short_codes').doc(code);
    const snap = await ref.get();
    if (!snap.exists) {
      return code;
    }
    attempt++;
  }
}

async function checkAndUpdateAllPendingWCodes() {
  console.log(`
==================================================
🔍 ตรวจสอบและอัปเดตรหัสชั่วคราว W- สำหรับทุกคนที่ยังไม่อนุมัติ
==================================================
  `);

  const usersSnap = await db.collection('users').get();
  const pendingWalkins = [];
  const updatedList = [];

  usersSnap.forEach(docSnap => {
    const d = docSnap.data();
    if (d.line_displayName === 'Rak') return;

    if (d.note === 'รอบหน้างาน') {
      const isApproved = d.walkin_status === 'APPROVED' || d.walkin_verified === true || d.is_verified === true;
      if (!isApproved) {
        pendingWalkins.push({ id: docSnap.id, ...d });
      }
    }
  });

  console.log(`พบผู้สมัครรอบหน้างานที่ยังไม่อนุมัติทั้งหมด: ${pendingWalkins.length} คน`);

  for (const u of pendingWalkins) {
    const currentTempCode = u.walkin_temp_short_code;
    const hasWPrefix = currentTempCode && currentTempCode.startsWith('W-');

    if (!hasWPrefix) {
      const newTempCode = await generateUniqueTempCode(db, u.id + '_' + (u.short_code || 'WALK'));
      const tempQr = `WALKIN_TEMP:${u.id}:${newTempCode}:${Date.now()}`;

      await db.collection('used_short_codes').doc(newTempCode).set({
        uid: u.id,
        type: 'walkin_temp',
        timestamp: new Date().toISOString()
      });

      await db.collection('users').doc(u.id).update({
        walkin_temp_short_code: newTempCode,
        walkin_temp_qr: tempQr,
        updatedAt: new Date().toISOString()
      });

      updatedList.push({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        studentId: u.studentId || '-',
        oldCode: currentTempCode || u.short_code || '-',
        newCode: newTempCode
      });
    }
  }

  console.log(`
==================================================
📊 ผลการตรวจสอบและอัปเดต:
--------------------------------------------------
- จำนวนคนที่ยังไม่อนุมัติรอบหน้างาน: ${pendingWalkins.length} คน
- มี W- Prefix อยู่แล้ว: ${pendingWalkins.length - updatedList.length} คน
- ดำเนินการอัปเดตรหัสเป็น W- ใหม่: ${updatedList.length} คน
==================================================
  `);

  if (updatedList.length > 0) {
    console.log('📋 รายการคนที่เพิ่งถูกอัปเดตรหัส W- เพิ่มเติม:');
    updatedList.forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.studentId}] ${item.name} (${item.oldCode} ➔ ${item.newCode})`);
    });
  } else {
    console.log('🎉 ทุกคนที่ยังไม่อนุมัติในรอบหน้างานมี W- Prefix ครบ 100% แล้ว!');
  }
}

checkAndUpdateAllPendingWCodes()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Error checking W- codes:", err);
    process.exit(1);
  });
