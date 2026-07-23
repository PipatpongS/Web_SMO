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
  const usersSnapshot = await db.collection('users').get();
  const nationalities = {};
  
  usersSnapshot.forEach(doc => {
    let nat = doc.data().nationality;
    if (nat === undefined || nat === null) {
      nat = 'UNDEFINED';
    } else {
      nat = nat.trim();
    }
    
    if (!nationalities[nat]) {
      nationalities[nat] = 0;
    }
    nationalities[nat]++;
  });

  console.log('--- Nationality Values ---');
  for (const [nat, count] of Object.entries(nationalities)) {
    console.log(`"${nat}": ${count} users`);
  }
  
  process.exit(0);
}

run();
