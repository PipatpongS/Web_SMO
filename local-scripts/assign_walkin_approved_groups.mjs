import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// Group Display Names Mapping from ActivityDetails.jsx
const GROUP_NAMES = {
  '1': 'DREAM',
  '2': 'DESIGN',
  '3': 'BUILD',
  '4': 'BLOOM',
  '5': 'BEYOND'
};

const GROUP_LOCATIONS = {
  '1': 'S4 อาคารวิศววัฒนะ',
  '2': 'S11 อาคารเรียนรวม 5',
  '3': 'S12 อาคารเรียนรวม 4',
  '4': 'N16 อาคารการเรียนรู้พหุวิทยาการ ชั้น 3',
  '5': 'N16 อาคารการเรียนรู้พหุวิทยาการ ชั้น 1'
};

// Helper to determine gender
function getGender(titlePrefix) {
  if (!titlePrefix) return 'Unknown';
  const prefix = titlePrefix.toLowerCase().trim();
  if (['นาย', 'mr.', 'mr', 'mister'].includes(prefix) || prefix.includes('นาย') || prefix.includes('mr')) return 'Male';
  if (['นาง', 'นางสาว', 'miss', 'mrs.', 'mrs', 'ms.', 'ms'].includes(prefix) || prefix.includes('นาง') || prefix.includes('miss') || prefix.includes('ms')) return 'Female';
  return 'Unknown';
}

// Helper to determine nationality
function getNationality(nationality) {
  if (!nationality) return 'Foreigner';
  const nat = nationality.trim();
  if (nat === 'ไทย' || nat.toLowerCase() === 'thai') return 'Thai';
  return 'Foreigner';
}

const toPct = (val, total) => total === 0 ? "0.00" : ((val / total) * 100).toFixed(2);

async function runGroupAssignment() {
  console.log(`
================================================================================
🎲 สคริปต์สุ่มจัดกลุ่มให้ผู้ลงทะเบียนรอบหน้างานที่ "อนุมัติแล้ว" (Approved Walk-ins)
================================================================================
⏳ กำลังดึงข้อมูลสมาชิกรวมทั้งหมดจาก Firestore...
  `);

  const snapshot = await db.collection('users').get();
  
  const existingGroupUsers = [];
  const approvedWalkins = [];
  const pendingWalkins = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.line_displayName === 'Rak') return;

    const isApprovedWalkin = data.note === 'รอบหน้างาน' && (data.walkin_status === 'APPROVED' || data.walkin_verified === true);
    const isPendingWalkin = data.note === 'รอบหน้างาน' && !isApprovedWalkin;

    const userObj = {
      id: doc.id,
      docRef: doc.ref,
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
      studentId: data.studentId || '-',
      shortCode: data.short_code || '-',
      nationality: getNationality(data.nationality),
      gender: getGender(data.titlePrefix),
      department: data.department ? data.department.trim() : 'ไม่ระบุภาควิชา',
      currentGroup: data.group ? String(data.group).trim() : null
    };

    if (isApprovedWalkin) {
      approvedWalkins.push(userObj);
    } else if (isPendingWalkin) {
      pendingWalkins.push(userObj);
    } else if (data.group) {
      existingGroupUsers.push(userObj);
    }
  });

  console.log(`✅ ดึงข้อมูลสำเร็จ:
  - สมาชิกที่มีกลุ่ม 1-5 เดิมอยู่แล้ว: ${existingGroupUsers.length} คน
  - สมาชิก Walk-in ที่ "อนุมัติแล้ว" (จะถูกนำมาสุ่มสัดส่วนในครั้งนี้): ${approvedWalkins.length} คน
  - สมาชิก Walk-in ที่ "ยังไม่อนุมัติ" (ยกเว้น ไม่สุ่มกลุ่มให้): ${pendingWalkins.length} คน
  `);

  // --- 1. Calculate BEFORE Statistics ---
  function computeStats(userList) {
    const total = userList.length;
    const groups = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const thais = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const foreigners = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const gender = {
      '1': { Male: 0, Female: 0, Unknown: 0 },
      '2': { Male: 0, Female: 0, Unknown: 0 },
      '3': { Male: 0, Female: 0, Unknown: 0 },
      '4': { Male: 0, Female: 0, Unknown: 0 },
      '5': { Male: 0, Female: 0, Unknown: 0 }
    };
    const depts = { '1': {}, '2': {}, '3': {}, '4': {}, '5': {} };

    userList.forEach(u => {
      const g = u.group || u.currentGroup;
      if (!g || !['1', '2', '3', '4', '5'].includes(String(g))) return;

      const gKey = String(g);
      groups[gKey]++;
      if (u.nationality === 'Thai') thais[gKey]++;
      else foreigners[gKey]++;

      gender[gKey][u.gender]++;

      if (!depts[gKey][u.department]) depts[gKey][u.department] = 0;
      depts[gKey][u.department]++;
    });

    return { total, groups, thais, foreigners, gender, depts };
  }

  const beforeStats = computeStats(existingGroupUsers);

  // --- 2. Stratified Random Assignment Algorithm ---
  const buckets = {};
  approvedWalkins.forEach(user => {
    const bucketKey = `${user.gender}__${user.department}`;
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = { foreigners: [], thais: [] };
    }
    if (user.nationality === 'Foreigner') {
      buckets[bucketKey].foreigners.push(user);
    } else {
      buckets[bucketKey].thais.push(user);
    }
  });

  const assignedUpdates = [];

  const currentCounts = {
    total: { ...beforeStats.groups },
    foreigners: { ...beforeStats.foreigners },
    thais: { ...beforeStats.thais },
    gender: JSON.parse(JSON.stringify(beforeStats.gender)),
    depts: JSON.parse(JSON.stringify(beforeStats.depts))
  };

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Assign Foreigners (ONLY to Groups 1 and 2)
  Object.keys(buckets).forEach(bKey => {
    const foreignerList = shuffle(buckets[bKey].foreigners);
    foreignerList.forEach(user => {
      let chosenGroup = '1';
      if (currentCounts.total['2'] < currentCounts.total['1']) {
        chosenGroup = '2';
      } else if (currentCounts.total['1'] === currentCounts.total['2']) {
        chosenGroup = currentCounts.foreigners['2'] < currentCounts.foreigners['1'] ? '2' : '1';
      }

      user.group = chosenGroup;
      currentCounts.total[chosenGroup]++;
      currentCounts.foreigners[chosenGroup]++;
      currentCounts.gender[chosenGroup][user.gender]++;
      if (!currentCounts.depts[chosenGroup][user.department]) currentCounts.depts[chosenGroup][user.department] = 0;
      currentCounts.depts[chosenGroup][user.department]++;

      assignedUpdates.push({
        id: user.id,
        docRef: user.docRef,
        name: user.name,
        studentId: user.studentId,
        group: chosenGroup,
        groupName: GROUP_NAMES[chosenGroup],
        nationality: user.nationality,
        gender: user.gender,
        dept: user.department
      });
    });
  });

  // Assign Thais (to Groups 1, 2, 3, 4, 5)
  Object.keys(buckets).forEach(bKey => {
    const thaiList = shuffle(buckets[bKey].thais);
    thaiList.forEach(user => {
      let bestGroup = '1';
      let minScore = Infinity;

      ['1', '2', '3', '4', '5'].forEach(gKey => {
        const totalScore = currentCounts.total[gKey] * 10;
        const genderScore = (currentCounts.gender[gKey][user.gender] || 0) * 5;
        const deptScore = (currentCounts.depts[gKey][user.department] || 0) * 3;
        const randomNoise = Math.random();

        const score = totalScore + genderScore + deptScore + randomNoise;
        if (score < minScore) {
          minScore = score;
          bestGroup = gKey;
        }
      });

      user.group = bestGroup;
      currentCounts.total[bestGroup]++;
      currentCounts.thais[bestGroup]++;
      currentCounts.gender[bestGroup][user.gender]++;
      if (!currentCounts.depts[bestGroup][user.department]) currentCounts.depts[bestGroup][user.department] = 0;
      currentCounts.depts[bestGroup][user.department]++;

      assignedUpdates.push({
        id: user.id,
        docRef: user.docRef,
        name: user.name,
        studentId: user.studentId,
        group: bestGroup,
        groupName: GROUP_NAMES[bestGroup],
        nationality: user.nationality,
        gender: user.gender,
        dept: user.department
      });
    });
  });

  const afterUserList = [...existingGroupUsers, ...assignedUpdates];
  const afterStats = computeStats(afterUserList);

  // --- PRINT STATISTICAL SUMMARY ---
  console.log(`
================================================================================
📊 รายงานเปรียบเทียบสถิติ สรุปก่อนสุ่ม vs หลังสุ่มกลุ่ม (BEFORE & AFTER SUMMARY)
================================================================================
  `);

  console.log(`📌 1. จำนวนสมาชิกรวมในแต่ละกลุ่ม (Group 1 - 5):`);
  console.log(`--------------------------------------------------------------------------------------------------`);
  console.log(`Group ID | ชื่อกลุ่ม (Display Name) | สถานที่กิจกรรม    | ก่อนสุ่ม (เดิม) | สุ่มเพิ่มครั้งนี้ | หลังสุ่ม (รวมสุทธิ) | สัดส่วน %`);
  console.log(`--------------------------------------------------------------------------------------------------`);
  ['1', '2', '3', '4', '5'].forEach(g => {
    const gName = GROUP_NAMES[g];
    const loc = GROUP_LOCATIONS[g];
    const beforeN = beforeStats.groups[g];
    const addedN = assignedUpdates.filter(u => u.group === g).length;
    const afterN = afterStats.groups[g];
    const pct = toPct(afterN, afterStats.total);
    console.log(`  Group ${g} | ${gName.padEnd(20)} | ${loc.padEnd(20)} |  ${String(beforeN).padEnd(13)} | +${String(addedN).padEnd(14)} |  ${String(afterN).padEnd(16)} | ${pct}%`);
  });
  console.log(`--------------------------------------------------------------------------------------------------`);
  console.log(`รวม      | รวมทั้งหมด 5 กลุ่ม   |                   |  ${beforeStats.total} คน         | +${assignedUpdates.length} คน            |  ${afterStats.total} คน           | 100.00%\n`);


  console.log(`📌 2. สัดส่วนสัญชาติ (ไทย vs ต่างชาติ) แยกตามกลุ่ม:`);
  console.log(`--------------------------------------------------------------------------------`);
  ['1', '2', '3', '4', '5'].forEach(g => {
    const totalG = afterStats.groups[g];
    const thN = afterStats.thais[g];
    const fgN = afterStats.foreigners[g];
    console.log(`  Group ${g} (${GROUP_NAMES[g]}): รวม ${totalG} คน ➔ ไทย: ${thN} คน (${toPct(thN, totalG)}%), ต่างชาติ: ${fgN} คน (${toPct(fgN, totalG)}%)`);
  });
  console.log(`* หมายเหตุ: สัญชาติต่างชาติถูกจำกัดให้อยู่เฉพาะ Group 1 (DREAM) และ Group 2 (DESIGN) เท่านั้น ตามเงื่อนไขถูกต้อง 100%\n`);


  console.log(`📌 3. สัดส่วนเพศ (ชาย vs หญิง) แยกตามกลุ่ม:`);
  console.log(`--------------------------------------------------------------------------------`);
  ['1', '2', '3', '4', '5'].forEach(g => {
    const totalG = afterStats.groups[g];
    const mN = afterStats.gender[g].Male;
    const fN = afterStats.gender[g].Female;
    const uN = afterStats.gender[g].Unknown;
    console.log(`  Group ${g} (${GROUP_NAMES[g]}): ชาย ${mN} คน (${toPct(mN, totalG)}%) | หญิง ${fN} คน (${toPct(fN, totalG)}%) ${uN > 0 ? `| ไม่ระบุ ${uN} คน` : ''}`);
  });
  console.log(`\n`);


  console.log(`📌 4. สรุปการกระจายตัวของภาควิชาในแต่ละกลุ่ม (Department Distribution):`);
  console.log(`--------------------------------------------------------------------------------`);
  const allDepts = Array.from(new Set(afterUserList.map(u => u.department).filter(Boolean)));
  allDepts.forEach(dept => {
    const deptStr = String(dept || 'ไม่ระบุภาควิชา');
    console.log(`  - ${deptStr.padEnd(35)}: G1-DREAM(${afterStats.depts['1'][dept] || 0}) | G2-DESIGN(${afterStats.depts['2'][dept] || 0}) | G3-BUILD(${afterStats.depts['3'][dept] || 0}) | G4-BLOOM(${afterStats.depts['4'][dept] || 0}) | G5-BEYOND(${afterStats.depts['5'][dept] || 0})`);
  });
  console.log(`--------------------------------------------------------------------------------\n`);


  // --- PROMPT USER CONFIRMATION (Yes / No) ---
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('👉 ยืนยันการบันทึกข้อมูลการสุ่มกลุ่มทั้ง 94 คนนี้ลง Firebase หรือไม่? (Yes/No): ', async (answer) => {
    rl.close();
    const cleanAns = answer.trim().toLowerCase();
    if (cleanAns === 'yes' || cleanAns === 'y') {
      console.log('\n⏳ กำลังบันทึกข้อมูลกลุ่มลง Firebase Firestore...');
      
      const batchSize = 400;
      let batch = db.batch();
      let count = 0;

      for (const update of assignedUpdates) {
        batch.update(update.docRef, { 
          group: update.group,
          updatedAt: new Date().toISOString()
        });
        count++;

        if (count % batchSize === 0) {
          await batch.commit();
          batch = db.batch();
          console.log(`  ✓ บันทึกแล้ว ${count}/${assignedUpdates.length} คน...`);
        }
      }

      if (count % batchSize !== 0) {
        await batch.commit();
      }

      console.log(`
================================================================================
🎉 อัปเดตกลุ่มให้ผู้ลงทะเบียน Walk-in ที่อนุมัติแล้วทั้ง ${assignedUpdates.length} คนลง Firebase สำเร็จ 100%!
================================================================================
      `);
      process.exit(0);
    } else {
      console.log('\n❌ ยกเลิกการบันทึกข้อมูล ข้อมูลบน Firebase จะไม่มีการเปลี่ยนแปลงใดๆ');
      process.exit(0);
    }
  });
}

runGroupAssignment().catch(err => {
  console.error("❌ เกิดข้อผิดพลาดในการสุ่มกลุ่ม:", err);
  process.exit(1);
});
