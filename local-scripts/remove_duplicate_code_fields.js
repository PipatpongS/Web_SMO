import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function cleanDuplicateFields() {
  console.log("=== Removing duplicate qrCode and shortCode fields from users collection ===");

  const usersSnap = await db.collection('users').get();
  console.log(`Total users in Firestore: ${usersSnap.size}`);

  let cleanedCount = 0;
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let opCount = 0;
  let batchIndex = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (data.qrCode !== undefined || data.shortCode !== undefined) {
      batch.update(userDoc.ref, {
        qrCode: FieldValue.delete(),
        shortCode: FieldValue.delete()
      });
      opCount++;
      cleanedCount++;

      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        batchIndex++;
        console.log(`[Batch ${batchIndex}] Removed duplicate fields from ${opCount} user docs.`);
        batch = db.batch();
        opCount = 0;
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
    batchIndex++;
    console.log(`[Batch ${batchIndex}] Removed duplicate fields from final ${opCount} user docs.`);
  }

  // Verification Check
  const verifySnap = await db.collection('users').get();
  let remainingDuplicates = 0;
  verifySnap.forEach(d => {
    const data = d.data();
    if (data.qrCode !== undefined || data.shortCode !== undefined) {
      remainingDuplicates++;
    }
  });

  console.log("\n================ VERIFICATION RESULT ================");
  console.log(`Total Users Processed: ${usersSnap.size}`);
  console.log(`Total User Docs Cleaned: ${cleanedCount}`);
  console.log(`Remaining Docs with qrCode/shortCode: ${remainingDuplicates} (Target: 0)`);
  console.log("====================================================\n");

  process.exit(0);
}

cleanDuplicateFields().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
