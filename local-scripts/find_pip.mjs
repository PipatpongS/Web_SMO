import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const GROUP_NAMES = { 1: 'DREAM', 2: 'DESIGN', 3: 'BUILD', 4: 'BLOOM', 5: 'BEYOND' };

async function main() {
  console.log('🔍 ค้นหา W-AI37 หรือ ชื่อ พิพ ทรัพย์สิน ใน Firestore...\n');

  // 1. Search in used_short_codes for W-AI37
  const scDoc = await db.collection('used_short_codes').doc('W-AI37').get();
  if (scDoc.exists) {
    console.log('✓ Found W-AI37 in used_short_codes:', scDoc.data());
    const uid = scDoc.data().uid;
    const uDoc = await db.collection('users').doc(uid).get();
    if (uDoc.exists) {
      console.log('  Found user doc:', uDoc.id, uDoc.data());
    }
  } else {
    console.log('❌ ไม่พบ W-AI37 ใน used_short_codes');
  }

  // 2. Search users where walkin_temp_short_code == W-AI37 or short_code == W-AI37 or short_code == AI37
  const q1 = await db.collection('users').where('walkin_temp_short_code', '==', 'W-AI37').get();
  console.log(`\nFound ${q1.size} docs with walkin_temp_short_code == W-AI37:`);
  q1.forEach(d => console.log('  ', d.id, d.data().firstName, d.data().lastName, d.data().walkin_status));

  const q2 = await db.collection('users').where('short_code', '==', 'W-AI37').get();
  console.log(`Found ${q2.size} docs with short_code == W-AI37:`);
  q2.forEach(d => console.log('  ', d.id, d.data().firstName, d.data().lastName, d.data().walkin_status));

  const q3 = await db.collection('users').where('short_code', '==', 'AI37').get();
  console.log(`Found ${q3.size} docs with short_code == AI37:`);
  q3.forEach(d => console.log('  ', d.id, d.data().firstName, d.data().lastName, d.data().walkin_status));

  // 3. Search users by firstName พิพ
  const q4 = await db.collection('users').where('firstName', '==', 'พิพ').get();
  console.log(`\nFound ${q4.size} docs with firstName == พิพ:`);
  q4.forEach(d => console.log('  ', d.id, d.data().firstName, d.data().lastName, d.data().walkin_status, d.data().short_code, d.data().walkin_temp_short_code));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
