import fs from 'fs';
import xlsx from 'xlsx';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updateVerifiedStudents() {
    console.log("🚀 เริ่มต้นกระบวนการยืนยันตัวตน (อัปเดตลง Database จริง)...");

    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ ไม่พบไฟล์แบ็คอัพ Firebase ในโฟลเดอร์ ./Firebase");
        return;
    }
    // เรียงชื่อไฟล์จากใหม่ไปเก่า (เพราะชื่อไฟล์เป็นวันที่-เวลา) และเลือกอันล่าสุด
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;

    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    console.log(`✅ โหลดข้อมูลจาก Excel (${studentList.length} คน) และ Firebase (${latestFile}) สำเร็จ\n`);

    let matchCount = 0;
    let alreadyVerifiedCount = 0;

    // นับว่าตอนนี้มีคนยังไม่ได้ verify ทั้งหมดกี่คนก่อนอัปเดต
    const totalFirebaseUnverified = firebaseUsersArray.filter(u => u.is_verified !== true).length;

    // ระบบ Batch ของ Firebase อัปเดตได้สูงสุด 500 รายการต่อ 1 ก้อน
    // เราจึงต้องทำระบบแบ่งก้อน (Chunk) เผื่อยอดอัปเดตเกิน 500 คน
    const batches = [];
    let currentBatch = db.batch();
    let currentOperationCount = 0;

    for (const row of studentList) {
        const excelStudentId = String(row[1]).trim();
        const excelFirstName = String(row[2] || '').trim();
        const excelMiddleName = String(row[3] || '').trim();
        const excelLastName = String(row[4] || '').trim();

        if (!excelStudentId || excelStudentId === 'undefined') continue;

        const matchingFbUsersById = firebaseUsersArray.filter(u => String(u.studentId).trim() === excelStudentId);

        if (matchingFbUsersById.length > 0) {
            for (const fbUser of matchingFbUsersById) {
                const fbFirstName = (fbUser.firstName || '').trim();
                const fbMiddleName = (fbUser.middleName || '').trim();
                const fbLastName = (fbUser.lastName || '').trim();

                // เช็คความเป๊ะ 100% (รหัส + ชื่อ + ชื่อกลาง + นามสกุล)
                if (fbFirstName === excelFirstName && fbMiddleName === excelMiddleName && fbLastName === excelLastName) {
                    if (fbUser.is_verified === true) {
                        alreadyVerifiedCount++;
                    } else {
                        // เพิ่มคำสั่งอัปเดตลงใน Batch
                        const userRef = db.collection('users').doc(fbUser.id);
                        currentBatch.update(userRef, { is_verified: true });
                        matchCount++;
                        currentOperationCount++;

                        // ถ้าตะกร้าเต็ม 500 ชิ้น ให้แพ็คตะกร้าเก็บไว้ แล้วเอาตะกร้าใบใหม่มาใส่ต่อ
                        if (currentOperationCount === 500) {
                            batches.push(currentBatch);
                            currentBatch = db.batch();
                            currentOperationCount = 0;
                        }
                    }
                }
            }
        }
    }

    // เก็บตะกร้าใบสุดท้าย (ที่อาจจะไม่ถึง 500 ชิ้น) เข้าคิวด้วย
    if (currentOperationCount > 0) {
        batches.push(currentBatch);
    }

    // ----------------------------------------------------
    // ส่งคำสั่งอัปเดตทั้งหมดขึ้น Firebase ทันที
    // ----------------------------------------------------
    if (matchCount > 0) {
        console.log(`⏳ กำลังส่งข้อมูลขึ้น Firebase จำนวน ${matchCount} คน (แบ่งเป็น ${batches.length} ก้อน)...`);

        try {
            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
                console.log(`   - ส่งก้อนที่ ${i + 1}/${batches.length} สำเร็จ`);
            }
            console.log("✅ อัปเดตข้อมูลขึ้น Database เสร็จสมบูรณ์แล้ว!");
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดระหว่างอัปเดต Firebase:", error);
        }
    } else {
        console.log("ℹ️ ไม่มีข้อมูลใหม่ที่ต้องอัปเดต (ทุกคนถูก Verify ไปหมดแล้ว)");
    }

    const remainingUnverified = totalFirebaseUnverified - matchCount;

    console.log("\n====== 📝 สรุปผลการอัปเดตจริง ======");
    console.log(`✅ อัปเดต is_verified = true สำเร็จ: ${matchCount} คน`);
    console.log(`ℹ️ คนที่เคยกดยืนยันไปแล้ว (ข้าม): ${alreadyVerifiedCount} คน`);
    console.log("-------------------------------------");
    console.log(`📉 หลังจากอัปเดตเสร็จ จะเหลือผู้ใช้ในระบบเว็บที่ยังไม่ได้ verify อีก: ${remainingUnverified} คน (จากทั้งหมด ${totalFirebaseUnverified} คนที่ยังไม่ผ่านก่อนหน้านี้)`);
    console.log("=====================================\n");
}

updateVerifiedStudents();
