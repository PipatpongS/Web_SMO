const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function countUsers() {
  try {
    const snapshot = await db.collection('users').count().get();
    console.log(`\n================================`);
    console.log(`👨‍🎓 จำนวนคนลงทะเบียนทั้งหมด: ${snapshot.data().count} คน`);
    console.log(`================================\n`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

countUsers();
