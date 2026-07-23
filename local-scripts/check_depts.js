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
  
  const deptStats = {
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}
  };
  const deptTotals = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const group = data.group;
    let dept = data.department ? data.department.trim() : 'UnknownDept';
    if (!group) return;
    
    if (!deptStats[group][dept]) deptStats[group][dept] = 0;
    deptStats[group][dept]++;
    
    if (!deptTotals[dept]) deptTotals[dept] = 0;
    deptTotals[dept]++;
  });

  const depts = Object.keys(deptTotals).sort((a,b) => deptTotals[b] - deptTotals[a]);
  
  console.log(JSON.stringify({ depts, deptStats, deptTotals }));
  process.exit(0);
}

run();
