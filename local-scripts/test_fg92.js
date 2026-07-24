import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function testLookup(code) {
  console.log(`Testing lookup for code: "${code}"`);
  const searchUpper = code.trim().toUpperCase();

  // 1. used_short_codes lookup
  const scDoc = await db.collection('used_short_codes').doc(searchUpper).get();
  if (scDoc.exists) {
    console.log(`Found in used_short_codes:`, scDoc.data());
    const uid = scDoc.data().uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      console.log(`SUCCESS! Found student profile:`, userDoc.data().firstName, userDoc.data().lastName, userDoc.data().studentId, userDoc.data().short_code);
      return userDoc.data();
    }
  }

  console.log(`NOT FOUND for "${code}"`);
  return null;
}

testLookup('FG92').then(() => process.exit(0));
