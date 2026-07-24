import fs from 'fs';
import crypto from 'crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function generateShortCode(baseQrCode, attempt = 0) {
  const input = baseQrCode + (attempt > 0 ? `_${attempt}` : '');
  const hash = crypto.createHash('sha256').update(input).digest();
  const hashArray = Array.from(hash);

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  code += letters[hashArray[0] % 26];
  code += letters[hashArray[1] % 26];
  code += numbers[hashArray[2] % 10];
  code += numbers[hashArray[3] % 10];

  return code;
}

async function run() {
  console.log("=== Starting Admin Audit & Sync for users and used_short_codes ===");

  // 1. Fetch used_short_codes
  const usedSnap = await db.collection('used_short_codes').get();
  const usedShortCodesMap = new Map(); // code -> uid
  usedSnap.forEach(doc => {
    usedShortCodesMap.set(doc.id, doc.data().uid || 'UNKNOWN');
  });
  console.log(`[Info] Initial used_short_codes count in Firestore: ${usedSnap.size}`);

  // 2. Fetch all users
  const usersSnap = await db.collection('users').get();
  console.log(`[Info] Total users in Firestore: ${usersSnap.size}`);

  const usedCodesSet = new Set(usedShortCodesMap.keys());
  const assignedCodesMap = new Map(); // shortCode -> uid

  let newlyGeneratedCount = 0;
  let collisionFixedCount = 0;

  const userUpdates = []; // { uid, qr_code, short_code }
  const usedCodeEntries = []; // { shortCode, uid }

  usersSnap.forEach(userDoc => {
    const uid = userDoc.id;
    const data = userDoc.data();

    const studentId = data.studentId || '';
    const lineUid = data.line_uid || uid;
    const qr_code = data.qr_code || data.qrCode || `${lineUid}:${studentId}`;

    let short_code = data.short_code || data.shortCode;

    // Validate if short_code exists and is not already claimed by another student
    if (!short_code || (assignedCodesMap.has(short_code) && assignedCodesMap.get(short_code) !== uid)) {
      if (short_code) {
        console.warn(`[Collision Resolution] User ${uid} had duplicate code ${short_code}. Regenerating...`);
        collisionFixedCount++;
      } else {
        newlyGeneratedCount++;
      }

      let attempt = 0;
      while (true) {
        const candidate = generateShortCode(qr_code, attempt);
        if (!usedCodesSet.has(candidate) && !assignedCodesMap.has(candidate)) {
          short_code = candidate;
          break;
        }
        attempt++;
      }
    }

    usedCodesSet.add(short_code);
    assignedCodesMap.set(short_code, uid);

    const needsUserDocUpdate = !data.short_code || !data.shortCode || !data.qr_code || !data.qrCode || data.short_code !== short_code;

    if (needsUserDocUpdate) {
      userUpdates.push({
        uid,
        qr_code,
        short_code
      });
    }

    usedCodeEntries.push({
      shortCode: short_code,
      uid
    });
  });

  console.log(`[Audit] Total users needing document field updates: ${userUpdates.length}`);
  console.log(`[Audit] Total used_short_codes entries to sync: ${usedCodeEntries.length}`);

  // 3. Batched Writes (Limit 400 operations per batch)
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let opCount = 0;
  let batchIndex = 0;

  // Batch update users collection
  for (const update of userUpdates) {
    const userRef = db.collection('users').doc(update.uid);
    batch.update(userRef, {
      qr_code: update.qr_code,
      qrCode: update.qr_code,
      short_code: update.short_code,
      shortCode: update.short_code
    });
    opCount++;

    if (opCount >= BATCH_SIZE) {
      await batch.commit();
      batchIndex++;
      console.log(`[Batch ${batchIndex}] Committed ${opCount} user document updates.`);
      batch = db.batch();
      opCount = 0;
    }
  }

  // Batch sync used_short_codes collection
  for (const entry of usedCodeEntries) {
    const scRef = db.collection('used_short_codes').doc(entry.shortCode);
    batch.set(scRef, {
      uid: entry.uid,
      timestamp: new Date().toISOString()
    }, { merge: true });
    opCount++;

    if (opCount >= BATCH_SIZE) {
      await batch.commit();
      batchIndex++;
      console.log(`[Batch ${batchIndex}] Committed ${opCount} used_short_codes entries.`);
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
    batchIndex++;
    console.log(`[Batch ${batchIndex}] Committed final ${opCount} entries.`);
  }

  // 4. Verification Check
  const verifyUsersSnap = await db.collection('users').get();
  const verifyUsedSnap = await db.collection('used_short_codes').get();

  const codeSet = new Set();
  let incompleteCount = 0;
  let duplicateCount = 0;

  verifyUsersSnap.forEach(doc => {
    const data = doc.data();
    if (!data.short_code || !data.qr_code || !data.shortCode || !data.qrCode) {
      incompleteCount++;
    }
    if (codeSet.has(data.short_code)) {
      duplicateCount++;
    } else {
      codeSet.add(data.short_code);
    }
  });

  console.log("\n================ VERIFICATION RESULT ================");
  console.log(`✅ Total Student Documents in users: ${verifyUsersSnap.size}`);
  console.log(`✅ Total Registered Documents in used_short_codes: ${verifyUsedSnap.size}`);
  console.log(`✅ Newly Generated Short Codes: ${newlyGeneratedCount}`);
  console.log(`✅ Collisions Fixed: ${collisionFixedCount}`);
  console.log(`✅ Missing Fields Count: ${incompleteCount} (Target: 0)`);
  console.log(`✅ Duplicate Short Codes Count: ${duplicateCount} (Target: 0)`);
  console.log("====================================================\n");

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal error during sync:", err);
  process.exit(1);
});
