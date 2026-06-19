const admin = require('firebase-admin');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let keyString = envContent.split("FIREBASE_SERVICE_ACCOUNT_KEY='")[1].split("'\n")[0];
// replace actual newlines with \n for JSON.parse
keyString = keyString.replace(/\r?\n/g, '\\n');

const serviceAccount = JSON.parse(keyString);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function countUsers() {
  try {
    const snapshot = await db.collection('users').count().get();
    console.log(`\n👨‍🎓 AMOUNT: ${snapshot.data().count}\n`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

countUsers();
