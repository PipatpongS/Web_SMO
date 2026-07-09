import fs from 'fs';
import xlsx from 'xlsx';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixVerifiedStatus() {
    console.log("🛠️ เริ่มกระบวนการแก้ไข (Fix) สถานะ is_verified...");

    // 1. โหลดข้อมูลจากไฟล์ Excel
    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    // เก็บลง Map เพื่อเทียบง่ายๆ
    const excelMap = new Map();
    for (const row of studentList) {
        const id = String(row[1]).trim();
        if (id && id !== 'undefined') {
            excelMap.set(id, {
                firstName: String(row[2] || '').trim(),
                middleName: String(row[3] || '').trim(),
                lastName: String(row[4] || '').trim()
            });
        }
    }

    // 2. โหลดข้อมูลจาก Firebase ทั้งหมด
    const snapshot = await db.collection('users').get();

    let setToTrueCount = 0;
    let revertToFalseCount = 0;
    
    const batches = [];
    let currentBatch = db.batch();
    let currentOperationCount = 0;

    snapshot.forEach(doc => {
        const fbUser = doc.data();
        const studentId = String(fbUser.studentId).trim();
        
        let shouldBeVerified = false;

        // เช็คว่ามีรหัสใน Excel ไหม
        if (excelMap.has(studentId)) {
            const ex = excelMap.get(studentId);
            
            const fbFirstName = (fbUser.firstName || '').trim();
            const fbMiddleName = (fbUser.middleName || '').trim();
            const fbLastName = (fbUser.lastName || '').trim();

            // เช็คความเป๊ะ 100% (ชื่อ + ชื่อกลาง + นามสกุล)
            if (fbFirstName === ex.firstName && fbMiddleName === ex.middleName && fbLastName === ex.lastName) {
                shouldBeVerified = true;
            }
        }

        // --- ทำการแก้ไขให้ตรงกับความจริง ---
        
        if (shouldBeVerified === true && fbUser.is_verified !== true) {
            // กรณี: ควรเป็น true แต่ในระบบยังไม่เป็น true
            const userRef = db.collection('users').doc(doc.id);
            currentBatch.update(userRef, { is_verified: true });
            setToTrueCount++;
            currentOperationCount++;
        } 
        else if (shouldBeVerified === false && fbUser.is_verified === true) {
            // กรณี: ไม่ควรเป็น true (ชื่อไม่ตรง/ไม่มีใน Excel) แต่ดันเป็น true อยู่ (โดน Staff กดให้ หรือหลุดมาจากสคริปต์เก่า)
            // ต้องริบคืนเป็น false
            const userRef = db.collection('users').doc(doc.id);
            currentBatch.update(userRef, { is_verified: false });
            revertToFalseCount++;
            currentOperationCount++;
            
            console.log(`⚠️ ปลดสถานะ is_verified ของรหัส ${studentId} (ชื่อไม่ตรงเป๊ะ 100%)`);
        }

        // ถ้า Batch เต็ม 500 ให้แพ็คใหม่
        if (currentOperationCount === 500) {
            batches.push(currentBatch);
            currentBatch = db.batch();
            currentOperationCount = 0;
        }
    });

    if (currentOperationCount > 0) {
        batches.push(currentBatch);
    }

    // 3. ส่งข้อมูลอัปเดตขึ้น Firebase
    console.log(`\n⏳ กำลังส่งคำสั่งอัปเดต Firebase (${batches.length} ก้อน)...`);
    try {
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
        }
        console.log("🎉 แก้ไขข้อมูลเสร็จสมบูรณ์!\n");
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดตอนอัปเดต:", error);
    }

    console.log("====== 📝 สรุปผลการ Fix ข้อมูล ======");
    console.log(`✅ อัปเดตให้เป็น Verified (true): ${setToTrueCount} คน`);
    console.log(`❌ ปลดสถานะ Verified (กลับเป็น false): ${revertToFalseCount} คน`);
    console.log("=====================================\n");
    
    process.exit(0);
}

fixVerifiedStatus();
