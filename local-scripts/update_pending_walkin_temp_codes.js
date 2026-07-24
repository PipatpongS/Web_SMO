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

// Helper to generate W- prefixed unique temporary short code
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

async function updatePendingWalkinTempCodes() {
  console.log(`
==================================================
🔄 เริ่มปรับปรุงรหัสชั่วคราว (W-XXXX) สำหรับผู้สมัคร Walk-in รอดำเนินการ
==================================================
  `);

  const usersSnap = await db.collection('users').get();
  const pendingDocs = [];

  usersSnap.forEach(docSnap => {
    const d = docSnap.data();
    if (d.line_displayName === 'Rak') return;
    if (d.note === 'รอบหน้างาน') {
      const isApproved = d.walkin_status === 'APPROVED' || d.walkin_verified === true;
      if (!isApproved) {
        pendingDocs.push({ id: docSnap.id, data: d });
      }
    }
  });

  console.log(`พบผู้สมัคร Walk-in ที่ยังไม่อนุมัติจำนวน ${pendingDocs.length} คน`);

  for (const p of pendingDocs) {
    const userId = p.id;
    const oldShortCode = p.data.short_code || 'WALKIN';
    const newTempCode = await generateUniqueTempCode(db, userId + '_' + oldShortCode);
    const tempQr = `WALKIN_TEMP:${userId}:${newTempCode}:${Date.now()}`;

    // 1. Reserve temp code in used_short_codes
    await db.collection('used_short_codes').doc(newTempCode).set({
      uid: userId,
      type: 'walkin_temp',
      timestamp: new Date().toISOString()
    });

    // 2. Update user doc in Firestore
    await db.collection('users').doc(userId).update({
      walkin_temp_short_code: newTempCode,
      walkin_temp_qr: tempQr,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ [${p.data.short_code || '-'}] ${p.data.studentId || '-'} | ${p.data.firstName} ${p.data.lastName} ➔ รหัสชั่วคราวใหม่: ${newTempCode}`);
  }

  console.log(`
==================================================
🎉 อัปเดตรหัสชั่วคราว (W-XXXX) สำหรับน้อง 15 คนเรียบร้อยแล้ว!
==================================================
  `);
}

updatePendingWalkinTempCodes()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Error updating temp codes:", err);
    process.exit(1);
  });
