import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath = './smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function run() {
  try {
    const snapshot = await db.collection('users').limit(20).get();
    let foundFood = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        const foodKeys = Object.keys(data).filter(k => 
            k.toLowerCase().includes('food') || 
            k.toLowerCase().includes('restriction') || 
            k.toLowerCase().includes('allergy') || 
            k.toLowerCase().includes('diet') || 
            k.toLowerCase().includes('meal') ||
            k.toLowerCase().includes('อาหาร') ||
            k.includes('Halal') || k.includes('ฮาลาล')
        );
        
        if (foodKeys.length > 0) {
            foundFood = true;
            console.log('\nDoc ID:', doc.id);
            for(const k of foodKeys) {
               console.log(`  ${k}:`, data[k]);
            }
        }
    });
    
    if (!foundFood) {
        console.log('\n[!] Could not find any food-related fields in the first 20 users.');
        // Print all keys of the first user just to see what we have
        if (!snapshot.empty) {
           console.log('\nSample keys for first user:', Object.keys(snapshot.docs[0].data()).join(', '));
        }
    }
  } catch(e) {
      console.error(e);
  }
  process.exit(0);
}
run();
