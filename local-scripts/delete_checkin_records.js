import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin (same key used by other local scripts)
const serviceAccount = JSON.parse(
  fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-3543e8d9ee.json', 'utf8')
);
const app = initializeApp({ credential: cert(serviceAccount) }, 'delete-checkin');
const db = getFirestore(app);

// ─── IDs to delete ───────────────────────────────────────────────────────────
const LOG_IDS = [
  'W41oI0zsfRnkmkgtz4pB',   // 2026-07-28T04:11:32.476+07:00 (corrected lowercase f)
];

// Checkin fields to erase from the users/* document (covers both Day 1 and Day 2)
const CHECKIN_FIELDS_DAY1 = [
  'checkin_day1_morning',
  'checkin_day1_morning_by',
  'checkin_day1_morning_by_staff_uid',
  'checkin_day1_morning_by_staff_name',
  'checkin_day1_morning_by_staff_pic',
  'checkin_day1_morning_ip',
  'checkin_day1_morning_device_model',
  'checkin_day1_morning_user_agent',
  'checkin_day1_morning_platform',
];
const CHECKIN_FIELDS_DAY2 = [
  'checkin_day2_morning',
  'checkin_day2_morning_by',
  'checkin_day2_morning_by_staff_uid',
  'checkin_day2_morning_by_staff_name',
  'checkin_day2_morning_by_staff_pic',
  'checkin_day2_morning_ip',
  'checkin_day2_morning_device_model',
  'checkin_day2_morning_user_agent',
  'checkin_day2_morning_platform',
];

async function run() {
  for (const logId of LOG_IDS) {
    console.log(`\n🔍 Processing log: ${logId}`);

    const logRef = db.collection('registration_checkin_logs').doc(logId);
    const logSnap = await logRef.get();

    if (!logSnap.exists) {
      console.log(`  ⚠️  Log document not found — skipping`);
      continue;
    }

    const logData = logSnap.data();
    const session = logData.session; // 'day1_morning' or 'day2_morning'
    const studentDocId = logData.student_doc_id;
    const studentName = logData.student_name || '';
    console.log(`  📋 Student: ${studentName} (doc: ${studentDocId}), session: ${session}`);

    // Build the field-delete payload for the correct day
    const fieldsToDelete = session === 'day1_morning' ? CHECKIN_FIELDS_DAY1 : CHECKIN_FIELDS_DAY2;
    const deletePayload = {};
    for (const field of fieldsToDelete) {
      deletePayload[field] = FieldValue.delete();
    }
    deletePayload.updatedAt = new Date().toISOString();

    // Batch: delete log + clear user checkin fields
    const batch = db.batch();

    if (studentDocId) {
      const userRef = db.collection('users').doc(studentDocId);
      batch.update(userRef, deletePayload);
      console.log(`  ✏️  Will clear ${fieldsToDelete.length} checkin fields from users/${studentDocId}`);
    }

    batch.delete(logRef);
    console.log(`  🗑️  Will delete log: registration_checkin_logs/${logId}`);

    await batch.commit();
    console.log(`  ✅ Done`);
  }

  console.log('\n🎉 All records deleted successfully.');
}

run().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
