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
  
  let foundDoc = null;
  const searchPrefix = "U639762";

  snapshot.forEach(doc => {
    if (doc.id.toLowerCase().startsWith(searchPrefix.toLowerCase())) {
      foundDoc = { id: doc.id, data: doc.data() };
    }
  });

  console.log("=== FIRESTORE SEARCH FOR U639762 ===");
  if (foundDoc) {
    console.log(`FOUND EXACT FIRESTORE DOC ID: "${foundDoc.id}"`);
    console.log("Data:", JSON.stringify(foundDoc.data, null, 2));
  } else {
    console.log("NOT FOUND in Firestore!");
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
