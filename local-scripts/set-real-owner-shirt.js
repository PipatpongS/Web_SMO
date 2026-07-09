import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const targetNames = [
    'ธีรเมธ แดงฉ่ำ',
    'อัณติกา มะณี',
    'ภูวกฤต วงษ์หาญ'
];

async function setRealOwnerShirt() {
    console.log("🛠️ กำลังเปลี่ยนสถานะสั่งเสื้อให้กลับเป็น true...");
    
    // ดึงผู้ใช้งานทั้งหมดมาเช็คชื่อโดยตรง
    const snapshot = await db.collection('users').get();
    
    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.replace(/\s+/g, ' ').trim();
        
        if (targetNames.includes(fullName)) {
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, { is_shirt_ordered: true });
            count++;
            console.log(`✅ อัปเดต is_shirt_ordered = true ให้: ${fullName} (รหัส ${data.studentId}) เรียบร้อย`);
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`\n🎉 ทำการอัปเดตกลับเป็น true สำเร็จจำนวน ${count} บัญชี!`);
    } else {
        console.log(`\n❌ ไม่พบรายชื่อที่ต้องการอัปเดต`);
    }
    
    process.exit(0);
}

setRealOwnerShirt();
