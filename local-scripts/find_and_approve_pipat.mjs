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
  // Search by lastName
  const snap = await db.collection('users')
    .where('lastName', '==', 'ทรัพย์รานนท์')
    .get();

  console.log(`พบ ${snap.size} คน นามสกุล ทรัพย์รานนท์:`);
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    console.log(`  DocID: ${docSnap.id}`);
    console.log(`  ชื่อ: ${d.firstName} ${d.lastName}`);
    console.log(`  walkin_status: ${d.walkin_status}`);
    console.log(`  note: ${d.note}`);
    console.log(`  group: ${d.group}`);
  }

  if (snap.empty) {
    // Broader search - get all students and filter
    console.log('\nค้นหาแบบ broad โดยดู note = รอบพิเศษ ที่ไม่มี group...');
    const all = await db.collection('users').where('note', 'in', ['รอบพิเศษ', 'รอบหน้างาน']).get();
    console.log(`\nพบ ${all.size} คน ที่มี note = รอบพิเศษ/รอบหน้างาน:`);
    for (const d of all.docs) {
      const data = d.data();
      if (!data.group || data.walkin_status !== 'APPROVED') {
        console.log(`  DocID: ${d.id}`);
        console.log(`  ชื่อ: ${data.firstName} ${data.lastName}`);
        console.log(`  walkin_status: ${data.walkin_status}`);
        console.log(`  group: ${data.group}`);
        console.log(`  note: ${data.note}`);
        console.log('---');
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
