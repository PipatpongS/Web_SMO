import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (ใช้ไฟล์ Key เดิมที่มีอยู่แล้วในโฟลเดอร์)
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

async function checkMissingStudentIdsCount() {
    console.log("🔍 กำลังนับจำนวนนักศึกษาที่ยังไม่ได้รหัสนักศึกษา...");

    try {
        // ดึงข้อมูลตามเงื่อนไขที่ 1 (ดูจากสถานะ studentIdStatus)
        const snapshot1 = await db.collection('users')
            .where('studentIdStatus', '==', 'ยังไม่ได้รับรหัสนักศึกษา')
            .get();

        // ดึงข้อมูลตามเงื่อนไขที่ 2 (ดูจากการกรอก studentId เป็นรหัสชั่วคราวหรือคำอื่นๆ)
        const snapshot2 = await db.collection('users')
            .where('studentId', 'in', ['68070500000', '69070500000', 'ยังไม่ได้รับรหัสนักศึกษา', 'ยังไม่ได้รับรหัส นศ'])
            .get();

        // นำข้อมูลทั้ง 2 ส่วนมารวมกันแบบตัดตัวซ้ำออก (เผื่อบางคนเข้าทั้ง 2 เงื่อนไข)
        const uniqueDocs = new Map();
        snapshot1.forEach(doc => uniqueDocs.set(doc.id, doc.data()));
        snapshot2.forEach(doc => uniqueDocs.set(doc.id, doc.data()));

        const totalCount = uniqueDocs.size;

        if (totalCount === 0) {
            console.log("✅ ยินดีด้วย! ตอนนี้นักศึกษาทุกคนได้รับรหัสนักศึกษาเรียบร้อยแล้ว");
        } else {
            console.log(`⚠️ มีนักศึกษาที่ยังไม่ได้รับรหัสนักศึกษา (หรือยังใช้รหัสชั่วคราว) ทั้งหมด: ${totalCount} คน`);
        }
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }
}

checkMissingStudentIdsCount();
