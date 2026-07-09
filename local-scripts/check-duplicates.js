import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkDuplicates() {
    console.log("🔍 กำลังดึงข้อมูลจาก Firebase เพื่อตรวจสอบรหัสนักศึกษาซ้ำ...");

    const snapshot = await db.collection('users').get();
    
    // ใช้ Map ในการจัดกลุ่มคนที่มีรหัสนักศึกษาเดียวกัน
    const studentMap = new Map();

    snapshot.forEach(doc => {
        const data = doc.data();
        const studentId = String(data.studentId || '').trim();
        
        // ข้ามพวกที่ไม่มีรหัสนักศึกษา หรือรหัสเป็นคำว่า 'undefined'
        if (!studentId || studentId === 'undefined') return;

        if (!studentMap.has(studentId)) {
            studentMap.set(studentId, []);
        }
        
        // เก็บข้อมูลแต่ละคนที่รหัสตรงกัน
        studentMap.get(studentId).push({
            docId: doc.id,
            fullName: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.replace(/\s+/g, ' ').trim(),
            is_verified: data.is_verified === true,
            is_shirt_ordered: data.is_shirt_ordered === true
        });
    });

    let duplicateCount = 0;
    console.log("\n==================================================");
    console.log("⚠️ รายงานผลการตรวจสอบรหัสนักศึกษาซ้ำซ้อนในระบบ");
    console.log("==================================================\n");

    for (const [studentId, accounts] of studentMap.entries()) {
        if (accounts.length > 1) {
            duplicateCount++;
            console.log(`👤 พบรหัสซ้ำ: ${studentId} (มี ${accounts.length} บัญชี)`);
            
            accounts.forEach((acc, index) => {
                const verifiedStatus = acc.is_verified ? '✅ ผ่าน' : '❌ ยังไม่ผ่าน';
                const shirtStatus = acc.is_shirt_ordered ? '👕 สั่งแล้ว' : '➖ ไม่ได้สั่ง';
                
                console.log(`   [${index + 1}] ชื่อ: ${acc.fullName.padEnd(30, ' ')} | ยืนยันตัวตน: ${verifiedStatus} | เสื้อ: ${shirtStatus}`);
            });
            console.log("--------------------------------------------------");
        }
    }

    if (duplicateCount === 0) {
        console.log("🎉 ยินดีด้วยครับ! ไม่มีรหัสนักศึกษาซ้ำกันเลยในระบบ ข้อมูลคลีน 100%");
    } else {
        console.log(`\n🚨 สรุป: พบรหัสนักศึกษาที่มีการลงทะเบียนซ้ำทั้งหมด ${duplicateCount} รหัส`);
        console.log("📌 (บางคนอาจจะกดสมัครเว็บเข้ามา 2 รอบ หรือใช้ LINE 2 ไอดีในการล็อกอินครับ)");
    }
    
    console.log("==================================================\n");
    process.exit(0);
}

checkDuplicates();
