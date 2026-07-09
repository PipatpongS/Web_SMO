import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// รายชื่อรหัสนักศึกษาที่มีปัญหา (คนละคนกันแน่นอน)
const TARGET_IDS = [
    '69070508414',
    '69070503490',
    '69070500043'
];

async function revertShirtOrdered() {
    console.log("🛠️ กำลังเปลี่ยนสถานะ is_shirt_ordered ให้กลับเป็น false...");
    
    try {
        const snapshot = await db.collection('users').where('studentId', 'in', TARGET_IDS).get();
        
        const batch = db.batch();
        let count = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const userRef = db.collection('users').doc(doc.id);
            
            // อัปเดตให้เป็น false
            batch.update(userRef, { is_shirt_ordered: false });
            count++;
            
            console.log(`✅ ตั้งค่า is_shirt_ordered = false ให้รหัส: ${data.studentId} (${data.firstName} ${data.lastName}) เรียบร้อย`);
        });

        if (count > 0) {
            await batch.commit();
            console.log(`\n🎉 ทำการอัปเดตกลับเป็น false สำเร็จจำนวน ${count} บัญชี!`);
        } else {
            console.log(`\n❌ ไม่พบบัญชีของ 3 รหัสนี้ในฐานข้อมูลเลยครับ`);
        }
    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
    }
    
    process.exit(0);
}

revertShirtOrdered();
