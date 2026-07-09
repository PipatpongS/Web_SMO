import fs from 'fs';
import xlsx from 'xlsx';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updateShirtOrdered() {
    console.log("👕 เริ่มต้นกระบวนการอัปเดตข้อมูลการสั่งเสื้อ (is_shirt_ordered)...");

    // 1. โหลดข้อมูลจากไฟล์ Excel ล่าสุด
    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    // เก็บเฉพาะรหัสนักศึกษาจาก Excel เอาไว้เช็ค
    const excelStudentIds = new Set();
    for (const row of studentList) {
        const id = String(row[1]).trim();
        if (id && id !== 'undefined') {
            excelStudentIds.add(id);
        }
    }

    // 2. โหลดข้อมูล Backup Firebase ล่าสุด
    const backupFilePath = './Firebase/2026-06-26-02-25-01.json';
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    console.log(`✅ โหลดข้อมูล Excel (${excelStudentIds.size} รหัส) และ Firebase (${firebaseUsersArray.length} คน) สำเร็จ\n`);

    let updateCount = 0;
    let alreadyUpdatedCount = 0;

    // เตรียมระบบ Batch ของ Firebase
    const batches = [];
    let currentBatch = db.batch();
    let currentOperationCount = 0;

    // 3. เริ่มวนลูปตรวจเช็คและอัปเดต
    for (const fbUser of firebaseUsersArray) {
        const studentId = String(fbUser.studentId).trim();
        
        // เช็คเงื่อนไขที่ต้องการอัปเดต:
        // 1. คนที่ is_verified เป็น true แล้ว
        // 2. หรือคนที่รหัสนักศึกษาตรงกับใน Excel (ซึ่งจะรวมคนที่ชื่อ/นามสกุลพิมพ์ผิดคลาดเคลื่อนด้วย)
        const isVerified = fbUser.is_verified === true;
        const isInExcel = excelStudentIds.has(studentId);

        if (isVerified || isInExcel) {
            // ถ้าตรงเงื่อนไข ให้เช็คว่าเคยอัปเดต is_shirt_ordered ไปแล้วหรือยัง
            if (fbUser.is_shirt_ordered === true) {
                alreadyUpdatedCount++;
            } else {
                // เพิ่มคำสั่งอัปเดตลงใน Batch
                const userRef = db.collection('users').doc(fbUser.id);
                currentBatch.update(userRef, { is_shirt_ordered: true });
                updateCount++;
                currentOperationCount++;

                // ถ้าแพ็คครบ 500 ให้ขึ้นตะกร้าใหม่
                if (currentOperationCount === 500) {
                    batches.push(currentBatch);
                    currentBatch = db.batch();
                    currentOperationCount = 0;
                }
            }
        }
    }

    // เก็บตก Batch ที่เหลือไม่ถึง 500
    if (currentOperationCount > 0) {
        batches.push(currentBatch);
    }

    // ----------------------------------------------------
    // 4. ส่งข้อมูลขึ้น Firebase
    // ----------------------------------------------------
    if (updateCount > 0) {
        console.log(`⏳ กำลังส่งข้อมูลขึ้น Firebase จำนวน ${updateCount} คน (แบ่งเป็น ${batches.length} ก้อน)...`);
        
        try {
            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
                console.log(`  - ก้อนที่ ${i + 1}/${batches.length} สำเร็จ`);
            }
            console.log("\n🎉 อัปเดตข้อมูลขึ้น Database เสร็จสมบูรณ์ทั้งหมด!");
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดตอนส่งข้อมูล:", error);
        }
    } else {
        console.log("ℹ️ ไม่มีข้อมูลใหม่ที่ต้องอัปเดต (ทุกคนถูกตั้งค่า is_shirt_ordered หมดแล้ว)");
    }

    console.log(`\n====== 📝 สรุปผลการอัปเดตเสื้อ ======`);
    console.log(`✅ อัปเดต is_shirt_ordered = true สำเร็จ: ${updateCount} คน`);
    console.log(`ℹ️ คนที่เคยอัปเดตไปแล้ว (ข้าม): ${alreadyUpdatedCount} คน`);
    console.log(`=====================================\n`);
    
    process.exit(0);
}

updateShirtOrdered();
