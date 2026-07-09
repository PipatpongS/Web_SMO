import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkUnverifiedIds() {
    console.log("🔍 กำลังตรวจสอบรหัสนักศึกษาของคนที่ยังไม่ผ่านการ Verify...");

    const snapshot = await db.collection('users').get();
    
    let count69070500000 = 0;
    let countUndefined = 0;
    let countOthers = 0;
    let totalUnverified = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        
        // สนใจเฉพาะคนที่ยังไม่ได้ verify (false หรือ undefined)
        if (data.is_verified !== true) {
            totalUnverified++;
            
            const studentId = String(data.studentId || '').trim();

            if (studentId === '69070500000') {
                count69070500000++;
            } else if (!studentId || studentId === 'undefined') {
                countUndefined++;
            } else {
                countOthers++;
            }
        }
    });

    console.log("\n==================================================");
    console.log(`📊 สรุปกลุ่มคนที่ "ยังไม่ได้ยืนยันตัวตน" (รวม ${totalUnverified} คน)`);
    console.log("==================================================");
    console.log(`- กรอกรหัสเป็น 69070500000 : ${count69070500000} คน`);
    console.log(`- กรอกเป็นรหัสอื่นๆ          : ${countOthers} คน`);
    console.log(`- ไม่ได้กรอกรหัส (หรือบัค)   : ${countUndefined} คน`);
    console.log("==================================================\n");
    
    process.exit(0);
}

checkUnverifiedIds();
