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
  const snapshot = await db.collection('users').get();
  
  const deptCounts = {};
  let totalUsers = 0;
  let missingDeptCount = 0;

  snapshot.forEach(doc => {
    totalUsers++;
    const data = doc.data();
    const dept = data.department ? String(data.department).trim() : null;

    if (!dept) {
      missingDeptCount++;
      return;
    }

    if (!deptCounts[dept]) {
      deptCounts[dept] = 0;
    }
    deptCounts[dept]++;
  });

  const sortedDepts = Object.keys(deptCounts).sort((a, b) => deptCounts[b] - deptCounts[a]);

  console.log("=== FIRESTORE UNIQUE DEPARTMENT ANALYSIS ===");
  console.log(`Total Users in Firestore: ${totalUsers}`);
  console.log(`Users with Missing/Null Department: ${missingDeptCount}`);
  console.log(`Total Unique Department Strings Found: ${sortedDepts.length}\n`);

  sortedDepts.forEach((deptStr, index) => {
    console.log(`${index + 1}. "${deptStr}" -> ${deptCounts[deptStr]} users`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
