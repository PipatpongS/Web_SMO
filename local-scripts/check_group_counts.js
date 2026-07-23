import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8')
);
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function checkGroupCounts() {
  console.log("🔍 Fetching users from Firestore...");
  const snapshot = await db.collection('users').get();
  
  const counts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    unassigned: 0,
    totalCounted: 0,
    excludedRak: 0
  };

  const rakAccounts = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const displayName = (data.displayName || '').trim();
    const firstName = (data.firstName || '').trim();
    const docId = doc.id;
    const lineUid = data.line_uid || docId;

    // Check if user is Rak's account (LINE UID: U639762d7e2dc60e6f184700fc9de7aa7 or name includes Rak/พิพัฒน์พงศ์)
    const isRak = lineUid === 'U639762d7e2dc60e6f184700fc9de7aa7' ||
                  displayName.toLowerCase().includes('rak') ||
                  firstName.toLowerCase().includes('rak') ||
                  displayName.includes('พิพัฒน์พงศ์') ||
                  firstName.includes('พิพัฒน์พงศ์');

    if (isRak) {
      counts.excludedRak++;
      rakAccounts.push({ id: docId, displayName, firstName: data.firstName, lastName: data.lastName, group: data.group });
      return;
    }

    counts.totalCounted++;
    const group = data.group;
    if (group && counts.hasOwnProperty(group)) {
      counts[group]++;
    } else {
      counts.unassigned++;
    }
  });

  console.log("\n==========================================");
  console.log("📊 รายงานจำนวนคนในแต่ละกลุ่มกิจกรรม (ไม่รวมบัญชี Rak)");
  console.log("==========================================");
  console.log(`กลุ่มที่ 1 (DREAM)   : ${counts[1]} คน`);
  console.log(`กลุ่มที่ 2 (DESIGN)  : ${counts[2]} คน`);
  console.log(`กลุ่มที่ 3 (BUILD)   : ${counts[3]} คน`);
  console.log(`กลุ่มที่ 4 (BLOOM)   : ${counts[4]} คน`);
  console.log(`กลุ่มที่ 5 (BEYOND)  : ${counts[5]} คน`);
  console.log(`ไม่ระบุกลุ่ม / Unassigned: ${counts.unassigned} คน`);
  console.log("------------------------------------------");
  console.log(`รวมผู้ใช้งานที่นับ: ${counts.totalCounted} คน`);
  console.log(`ยกเว้นบัญชี Rak (${counts.excludedRak} คน):`, JSON.stringify(rakAccounts, null, 2));
  console.log("==========================================\n");
}

checkGroupCounts().catch(err => console.error(err));
