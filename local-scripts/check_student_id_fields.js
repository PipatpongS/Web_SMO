import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath = './smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function run() {
  const snapshot = await db.collection('users').limit(10).get();
  
  console.log("=== INSPECTING STUDENT ID FIELDS IN FIRESTORE ===");
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Doc ID: ${doc.id}`);
    console.log(`  studentId: "${data.studentId}"`);
    console.log(`  id: "${data.id}"`);
    console.log(`  student_id: "${data.student_id}"`);
  });

  // Check if any student has a 11-digit ID and query by studentId vs student_id vs id
  const sampleDoc = snapshot.docs.find(d => d.data().studentId || d.data().id || d.data().student_id);
  if (sampleDoc) {
    const d = sampleDoc.data();
    const testId = d.studentId || d.id || d.student_id;
    console.log(`\nTesting Queries for Student ID: "${testId}"`);

    const q1 = await db.collection('users').where('studentId', '==', String(testId)).get();
    console.log(`  where('studentId', '==', "${testId}") -> ${q1.size} results`);

    const q2 = await db.collection('users').where('id', '==', String(testId)).get();
    console.log(`  where('id', '==', "${testId}") -> ${q2.size} results`);

    const q3 = await db.collection('users').where('student_id', '==', String(testId)).get();
    console.log(`  where('student_id', '==', "${testId}") -> ${q3.size} results`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
