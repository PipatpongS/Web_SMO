import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate service account JSON
const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key file not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function approveWalkinByCode(inputCode) {
  if (!inputCode) {
    console.log(`
==================================================
❌ ERROR: Please provide a Short Code or Student ID.
--------------------------------------------------
Usage:
  node approve_walkin_shortcode.js <SHORT_CODE>

Example:
  node approve_walkin_shortcode.js BR78
==================================================
    `);
    process.exit(1);
  }

  const cleanCode = inputCode.trim().toUpperCase();
  console.log(`\n🔍 Searching for student with code: "${cleanCode}"...`);

  let targetDocId = null;
  let targetData = null;

  // 1. Search in used_short_codes collection
  const scDoc = await db.collection('used_short_codes').doc(cleanCode).get();
  if (scDoc.exists && scDoc.data()?.uid) {
    const uid = scDoc.data().uid;
    const uDoc = await db.collection('users').doc(uid).get();
    if (uDoc.exists) {
      targetDocId = uDoc.id;
      targetData = uDoc.data();
      console.log(`✓ Found student profile via used_short_codes map.`);
    }
  }

  // 2. Search in users by walkin_temp_short_code
  if (!targetDocId) {
    const qTemp = await db.collection('users').where('walkin_temp_short_code', '==', cleanCode).limit(1).get();
    if (!qTemp.empty) {
      targetDocId = qTemp.docs[0].id;
      targetData = qTemp.docs[0].data();
      console.log(`✓ Found student profile via walkin_temp_short_code query.`);
    }
  }

  // 3. Search in users by short_code
  if (!targetDocId) {
    const q1 = await db.collection('users').where('short_code', '==', cleanCode).limit(1).get();
    if (!q1.empty) {
      targetDocId = q1.docs[0].id;
      targetData = q1.docs[0].data();
      console.log(`✓ Found student profile via short_code query.`);
    }
  }

  // 4. Search in users by shortCode
  if (!targetDocId) {
    const q2 = await db.collection('users').where('shortCode', '==', cleanCode).limit(1).get();
    if (!q2.empty) {
      targetDocId = q2.docs[0].id;
      targetData = q2.docs[0].data();
      console.log(`✓ Found student profile via shortCode query.`);
    }
  }

  // 5. Search in users by studentId
  if (!targetDocId) {
    const q3 = await db.collection('users').where('studentId', '==', cleanCode).limit(1).get();
    if (!q3.empty) {
      targetDocId = q3.docs[0].id;
      targetData = q3.docs[0].data();
      console.log(`✓ Found student profile via studentId query.`);
    }
  }

  // 6. Direct docId lookup
  if (!targetDocId) {
    const uDoc = await db.collection('users').doc(cleanCode).get();
    if (uDoc.exists) {
      targetDocId = uDoc.id;
      targetData = uDoc.data();
      console.log(`✓ Found student profile via document ID.`);
    }
  }

  if (!targetDocId || !targetData) {
    console.error(`❌ NOT FOUND: No student record matching "${cleanCode}" was found in Firestore.`);
    process.exit(1);
  }

  const studentName = `${targetData.firstName || ''} ${targetData.lastName || ''}`.trim() || 'N/A';
  const studentId = targetData.studentId || 'N/A';
  const department = targetData.department || 'N/A';

  console.log(`
--------------------------------------------------
Student Record Found:
  • Name:       ${studentName}
  • Student ID: ${studentId}
  • Department: ${department}
  • Document ID:${targetDocId}
--------------------------------------------------
Updating Walk-in status to APPROVED...
  `);

  const approvedAt = new Date().toISOString();
  const updatePayload = {
    walkin_status: 'APPROVED',
    walkin_verified: true,
    walkin_approved_at: approvedAt,
    walkin_approved_by_staff_name: 'Admin Script CLI',
    walkin_approved_by_staff_uid: 'ADMIN_SCRIPT',
    updatedAt: approvedAt
  };

  // Perform Update
  await db.collection('users').doc(targetDocId).update(updatePayload);

  // Record Audit Log
  try {
    await db.collection('staff_access_logs').add({
      timestamp: approvedAt,
      event: 'WALKIN_APPROVED_VIA_SCRIPT',
      student_doc_id: targetDocId,
      student_id: studentId,
      student_name: studentName,
      staff_line_uid: 'ADMIN_SCRIPT',
      staff_name: 'Admin Script CLI',
      search_code: cleanCode
    });
  } catch (err) {
    console.warn('Note on audit log:', err.message);
  }

  console.log(`
==================================================
✅ WALKIN REGISTRATION APPROVED SUCCESSFULLY!
==================================================
  • Student Name: ${studentName}
  • Student ID:   ${studentId}
  • Short Code:   ${cleanCode}
  • Walk-in Status: APPROVED
  • Verified:     true
==================================================
  `);
}

const inputCode = process.argv[2];
approveWalkinByCode(inputCode)
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  });
