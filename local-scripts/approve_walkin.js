import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service Account Path
const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key file not found at: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function findStudent(code) {
  // 1. Fast lookup: used_short_codes collection
  try {
    const scDoc = await db.collection('used_short_codes').doc(code).get();
    if (scDoc.exists && scDoc.data()?.uid) {
      const uid = scDoc.data().uid;
      const uDoc = await db.collection('users').doc(uid).get();
      if (uDoc.exists) return { id: uDoc.id, data: uDoc.data() };
    }
  } catch (err) {}

  // 2. Query walkin_temp_short_code
  try {
    const q1 = await db.collection('users').where('walkin_temp_short_code', '==', code).limit(1).get();
    if (!q1.empty) return { id: q1.docs[0].id, data: q1.docs[0].data() };
  } catch (err) {}

  // 3. Query short_code
  try {
    const q2 = await db.collection('users').where('short_code', '==', code).limit(1).get();
    if (!q2.empty) return { id: q2.docs[0].id, data: q2.docs[0].data() };
  } catch (err) {}

  // 4. Query shortCode
  try {
    const q3 = await db.collection('users').where('shortCode', '==', code).limit(1).get();
    if (!q3.empty) return { id: q3.docs[0].id, data: q3.docs[0].data() };
  } catch (err) {}

  // 5. Query studentId
  try {
    const q4 = await db.collection('users').where('studentId', '==', code).limit(1).get();
    if (!q4.empty) return { id: q4.docs[0].id, data: q4.docs[0].data() };
  } catch (err) {}

  // 6. Direct docId
  try {
    const uDoc = await db.collection('users').doc(code).get();
    if (uDoc.exists) return { id: uDoc.id, data: uDoc.data() };
  } catch (err) {}

  return null;
}

async function approveWalkinByCode(inputCode) {
  if (!inputCode) {
    console.log(`
==================================================
❌ ERROR: Please provide a Short Code or Student ID.
--------------------------------------------------
Usage:
  node approve_walkin.js <SHORT_CODE>

Example:
  node approve_walkin.js II50
==================================================
    `);
    process.exit(1);
  }

  const rawCode = inputCode.trim().toUpperCase();
  console.log(`\n🔍 Searching for student with code: "${rawCode}"...`);

  // Generate candidate variants (e.g. II50 -> LL50, 1150)
  const candidateCodes = [rawCode];
  if (rawCode.includes('I')) {
    candidateCodes.push(rawCode.replace(/I/g, 'L'));
    candidateCodes.push(rawCode.replace(/I/g, '1'));
  }
  if (rawCode.includes('L')) {
    candidateCodes.push(rawCode.replace(/L/g, 'I'));
    candidateCodes.push(rawCode.replace(/L/g, '1'));
  }
  if (rawCode.includes('1')) {
    candidateCodes.push(rawCode.replace(/1/g, 'I'));
    candidateCodes.push(rawCode.replace(/1/g, 'L'));
  }

  let match = null;
  let matchedCode = rawCode;

  for (const candidate of candidateCodes) {
    match = await findStudent(candidate);
    if (match) {
      matchedCode = candidate;
      break;
    }
  }

  if (!match) {
    console.error(`❌ NOT FOUND: No student record matching "${rawCode}" (or variants: ${candidateCodes.join(', ')}) was found in Firestore.`);
    console.error(`Please verify that the student has completed Walk-in registration on the website.`);
    process.exit(1);
  }

  const targetDocId = match.id;
  const targetData = match.data;
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

  // Auto-sync used_short_codes map
  try {
    if (matchedCode.length === 4) {
      await db.collection('used_short_codes').doc(matchedCode).set({
        uid: targetDocId,
        timestamp: approvedAt
      }, { merge: true });
    }
  } catch (err) {}

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
      search_code: matchedCode
    });
  } catch (err) {}

  console.log(`
==================================================
✅ WALKIN REGISTRATION APPROVED SUCCESSFULLY!
==================================================
  • Student Name: ${studentName}
  • Student ID:   ${studentId}
  • Short Code:   ${matchedCode}
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
