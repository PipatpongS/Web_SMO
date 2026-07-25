import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBr78uKh8F8gU6oNQbi7VvByPPUVonp4Cs",
  authDomain: "smo-vidva-bangmod.firebaseapp.com",
  projectId: "smo-vidva-bangmod",
  storageBucket: "smo-vidva-bangmod.firebasestorage.app",
  messagingSenderId: "692203187728",
  appId: "1:692203187728:web:b6311f637541c8f0dd6495"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWebSdk(code) {
  console.log(`Testing Web SDK lookup for: ${code}`);
  
  // 1. used_short_codes lookup
  try {
    const scRef = doc(db, 'used_short_codes', code);
    const scSnap = await getDoc(scRef);
    if (scSnap.exists()) {
      console.log('Found in used_short_codes:', scSnap.data());
      const uid = scSnap.data().uid;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        console.log('SUCCESS Web SDK Found Student:', userSnap.data().firstName, userSnap.data().lastName);
        return { id: userSnap.id, data: userSnap.data() };
      }
    }
  } catch (e) {
    console.warn('scRef err:', e.message);
  }

  // 2. Query users by walkin_temp_short_code
  try {
    const q1 = query(collection(db, 'users'), where('walkin_temp_short_code', '==', code));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const d = snap1.docs[0];
      console.log('SUCCESS via walkin_temp_short_code:', d.data().firstName, d.data().lastName);
      return { id: d.id, data: d.data() };
    }
  } catch (e) {
    console.warn('q1 err:', e.message);
  }

  // 3. Query users by short_code
  try {
    const q2 = query(collection(db, 'users'), where('short_code', '==', code));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const d = snap2.docs[0];
      console.log('SUCCESS via short_code:', d.data().firstName, d.data().lastName);
      return { id: d.id, data: d.data() };
    }
  } catch (e) {
    console.warn('q2 err:', e.message);
  }

  console.log('NOT FOUND via Web SDK for', code);
  return null;
}

const inputCode = process.argv[2] || 'XD39';
testWebSdk(inputCode).then(res => {
  if (res) {
    console.log('Updating via Web SDK...');
    const userRef = doc(db, 'users', res.id);
    const now = new Date().toISOString();
    return updateDoc(userRef, {
      walkin_status: 'APPROVED',
      walkin_verified: true,
      walkin_approved_at: now,
      walkin_approved_by_staff_name: 'Admin Script CLI (Web SDK)',
      walkin_approved_by_staff_uid: 'ADMIN_SCRIPT_WEB',
      updatedAt: now
    }).then(() => {
      console.log(`✅ SUCCESSFULLY APPROVED ${res.data.firstName} ${res.data.lastName} (${inputCode}) via Web SDK!`);
      process.exit(0);
    });
  } else {
    process.exit(1);
  }
}).catch(err => {
  console.error("Web SDK Error:", err);
  process.exit(1);
});
