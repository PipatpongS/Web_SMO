import fs from 'fs';
import xlsx from 'xlsx';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function verifyStudents() {
    console.log("1. เริ่มต้นอ่านไฟล์ Excel...");

    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    console.log(`✅ ดึงรายชื่อนักศึกษาจาก Excel ได้ทั้งหมด ${studentList.length} คน`);
    console.log("----------------------------------------");

    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ ไม่พบไฟล์แบ็คอัพ Firebase ในโฟลเดอร์ ./Firebase");
        return;
    }
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    
    console.log(`2. กำลังอ่านข้อมูล Firebase จากไฟล์ล่าสุด: ${backupFilePath}`);

    // เก็บเป็น Array เต็มๆ ตามต้นฉบับเลย จะได้ข้อมูลครบทุกคนแบบไม่มีทางโดนเซฟทับ (นับด้วย LINE ID)
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    console.log(`✅ นำเข้าข้อมูล Firebase สำเร็จครบทุกคน! (${firebaseUsersArray.length} คน)`);
    console.log("----------------------------------------");
    console.log("3. กำลังนำข้อมูลมาชนกัน (เช็คเท่านั้น ยังไม่อัปเดตจริง)...");

    let matchCount = 0;
    let nameMismatchCount = 0;
    let notFoundCount = 0;
    let alreadyVerifiedCount = 0;

    for (const row of studentList) {
        const excelStudentId = String(row[1]).trim();
        const excelFirstName = String(row[2] || '').trim();
        const excelMiddleName = String(row[3] || '').trim();
        const excelLastName = String(row[4] || '').trim();

        if (!excelStudentId || excelStudentId === 'undefined') continue;

        // ค้นหาเด็กใน Firebase ที่รหัสตรงกับ Excel
        // ใช้ .filter เพื่อดึงมาทั้งหมดเผื่อมีเคสที่เด็กกรอกรหัสซ้ำกัน
        const matchingFbUsersById = firebaseUsersArray.filter(u => String(u.studentId).trim() === excelStudentId);

        if (matchingFbUsersById.length > 0) {
            let foundExactMatch = false;

            // วนลูปเช็คเด็กทุกคนที่มีรหัสตรงกัน
            for (const fbUser of matchingFbUsersById) {
                const fbFirstName = (fbUser.firstName || '').trim();
                const fbMiddleName = (fbUser.middleName || '').trim();
                const fbLastName = (fbUser.lastName || '').trim();

                if (fbFirstName === excelFirstName && fbMiddleName === excelMiddleName && fbLastName === excelLastName) {
                    foundExactMatch = true;
                    if (fbUser.is_verified === true) {
                        alreadyVerifiedCount++;
                    } else {
                        // แค่นับจำนวนไว้ก่อน (Dry Run)
                        matchCount++;
                    }
                }
            }

            // ถ้ารหัสตรงแต่ไม่มีชื่อ-นามสกุลไหนตรงเลย
            if (!foundExactMatch) {
                nameMismatchCount++;
            }

        } else {
            notFoundCount++;
        }
    }

    const totalFirebaseUnverified = firebaseUsersArray.filter(u => u.is_verified !== true).length;
    const remainingUnverified = totalFirebaseUnverified - matchCount;

    console.log("\n====== 📝 สรุปผลการเช็คข้อมูล (Dry Run) ======");
    console.log(`✅ ข้อมูลเป๊ะ 100% (รหัส+ชื่อ+กลาง+นามสกุล) และพร้อมจะอัปเดต: ${matchCount} คน`);
    console.log(`ℹ️ เป๊ะ 100% แต่เคยยืนยันไปแล้ว: ${alreadyVerifiedCount} คน`);
    console.log(`⚠️ รหัสตรง แต่ชื่อ/นามสกุลพิมพ์ผิดคลาดเคลื่อน: ${nameMismatchCount} คน`);
    console.log(`❌ ไม่พบรหัสนี้ในระบบ Web เลย: ${notFoundCount} คน`);
    console.log("-------------------------------------");
    console.log(`📉 หากอัปเดตข้อมูลเป๊ะสำเร็จ จะเหลือผู้ใช้ในระบบเว็บที่ยังไม่ได้ verify อีก: ${remainingUnverified} คน (จากทั้งหมด ${totalFirebaseUnverified} คนที่ยังไม่ผ่าน)`);
    console.log("=====================================\n");
}

verifyStudents();