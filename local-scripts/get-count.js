import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const snapshot = await db.collection('users').count().get();
  const now = new Date();
  const timeString = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  console.log(`\n=================================`);
  console.log(`⏰ อัปเดตล่าสุด: ${timeString} น.`);
  console.log(`👨‍🎓 จำนวนคนลงทะเบียนทั้งหมด: ${snapshot.data().count} คน`);
  console.log(`=================================\n`);
  process.exit(0);
}

run();
