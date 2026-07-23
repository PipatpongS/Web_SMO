import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import readline from 'readline';

const serviceAccountPath = './smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

// Helper to determine gender from titlePrefix
function getGender(titlePrefix) {
  if (!titlePrefix) return 'Unknown';
  const prefix = titlePrefix.toLowerCase().trim();
  const malePrefixes = ['นาย', 'mr.', 'mr', 'mister'];
  const femalePrefixes = ['นาง', 'นางสาว', 'miss', 'mrs.', 'mrs', 'ms.', 'ms'];
  
  if (malePrefixes.includes(prefix)) return 'Male';
  if (femalePrefixes.includes(prefix)) return 'Female';
  
  if (prefix.includes('นาย') || prefix.includes('mr')) return 'Male';
  if (prefix.includes('นาง') || prefix.includes('miss') || prefix.includes('ms') || prefix.includes('mrs')) return 'Female';
  
  return 'Unknown';
}

// Helper to determine nationality type
function getNationalityType(nationality) {
  if (!nationality) return 'Foreigner';
  const nat = nationality.trim();
  if (nat === 'ไทย' || nat.toLowerCase() === 'thai') return 'Thai';
  return 'Foreigner';
}

async function run() {
  console.log('Fetching users from Firebase...');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const users = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    users.push({
      id: doc.id,
      docRef: doc.ref,
      nationality: getNationalityType(data.nationality),
      gender: getGender(data.titlePrefix),
      department: data.department ? data.department.trim() : 'UnknownDept',
      joinActivity: data.joinActivity ? data.joinActivity.trim() : 'UnknownJoin'
    });
  });
  console.log(`Fetched ${users.length} users.\n`);

  // Group into macro-buckets
  const buckets = {};
  users.forEach(user => {
    const bucketKey = `${user.gender}_${user.department}_${user.joinActivity}`;
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        foreigners: [],
        thais: []
      };
    }
    if (user.nationality === 'Foreigner') {
      buckets[bucketKey].foreigners.push(user);
    } else {
      buckets[bucketKey].thais.push(user);
    }
  });

  const updates = []; // Array of { docRef, group, nationality, gender, dept }
  
  // GLOBAL deficit tracker to ensure perfectly even distribution across all buckets
  let globalDeficit = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  for (const [key, bucket] of Object.entries(buckets)) {
    const numForeigners = bucket.foreigners.length;
    const numThais = bucket.thais.length;
    const totalUsers = numForeigners + numThais;
    
    // Ideal count per group for this specific bucket
    const targetPerGroup = totalUsers / 5;
    
    // Increase global deficit by the target
    for (let g = 1; g <= 5; g++) {
      globalDeficit[g] += targetPerGroup;
    }
    
    // Distribute Foreigners to 1 and 2
    for (const user of bucket.foreigners) {
      // Find max deficit between group 1 and 2
      let maxGroup = globalDeficit[1] >= globalDeficit[2] ? 1 : 2;
      
      updates.push({ 
        docRef: user.docRef, 
        group: maxGroup, 
        nationality: user.nationality,
        gender: user.gender,
        dept: user.department
      });
      globalDeficit[maxGroup] -= 1;
    }
    
    // Distribute Thais to the group (1-5) with the highest remaining global deficit
    for (const user of bucket.thais) {
      let maxGroup = 1;
      let maxQuota = -Infinity;
      for (let g = 1; g <= 5; g++) {
        if (globalDeficit[g] > maxQuota) {
          maxQuota = globalDeficit[g];
          maxGroup = g;
        }
      }
      
      updates.push({ 
        docRef: user.docRef, 
        group: maxGroup, 
        nationality: user.nationality,
        gender: user.gender,
        dept: user.department
      });
      globalDeficit[maxGroup] -= 1; 
    }
  }

  // --- Print Statistics ---
  const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const thaiStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const foreignerStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const genderStats = {
    1: { Male: 0, Female: 0, Unknown: 0 },
    2: { Male: 0, Female: 0, Unknown: 0 },
    3: { Male: 0, Female: 0, Unknown: 0 },
    4: { Male: 0, Female: 0, Unknown: 0 },
    5: { Male: 0, Female: 0, Unknown: 0 }
  };
  
  let totalProcessed = updates.length;

  for(const u of updates) {
    stats[u.group]++;
    if(u.nationality === 'Thai') thaiStats[u.group]++;
    else foreignerStats[u.group]++;
    
    genderStats[u.group][u.gender]++;
  }

  const toPct = (val, total) => total === 0 ? "0.00" : ((val / total) * 100).toFixed(2);

  console.log('=== Distribution Result Statistics ===');
  for (let g = 1; g <= 5; g++) {
     const gTotal = stats[g];
     const pctTotal = toPct(gTotal, totalProcessed);
     
     console.log(`\n--- Group ${g} ---`);
     console.log(`Total: ${gTotal} users (${pctTotal}% of all users)`);
     console.log(`  Nationality:`);
     console.log(`    - Thai: ${thaiStats[g]} (${toPct(thaiStats[g], gTotal)}%)`);
     console.log(`    - Foreigner: ${foreignerStats[g]} (${toPct(foreignerStats[g], gTotal)}%)`);
     console.log(`  Gender:`);
     console.log(`    - Male: ${genderStats[g].Male} (${toPct(genderStats[g].Male, gTotal)}%)`);
     console.log(`    - Female: ${genderStats[g].Female} (${toPct(genderStats[g].Female, gTotal)}%)`);
     console.log(`    - Unknown: ${genderStats[g].Unknown} (${toPct(genderStats[g].Unknown, gTotal)}%)`);
  }
  console.log('\n======================================\n');
  
  // Prompt user for confirmation before updating
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Are you sure you want to update Firebase with these groups? (Yes/No): ', async (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      console.log(`\nStarting to update ${updates.length} users to Firebase...`);
      
      let batch = db.batch();
      let count = 0;
      let batchCount = 0;
      
      for (const update of updates) {
        batch.update(update.docRef, { group: update.group });
        count++;
        
        if (count === 500) {
          await batch.commit();
          batchCount++;
          console.log(`Committed batch ${batchCount} (500 users)`);
          batch = db.batch();
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
        batchCount++;
        console.log(`Committed final batch ${batchCount} (${count} users)`);
      }
      
      console.log('\nSuccessfully updated all users!');
      process.exit(0);
    } else {
      console.log('Update cancelled by user.');
      process.exit(0);
    }
  });
}

run();
