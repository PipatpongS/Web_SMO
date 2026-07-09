import fs from 'fs';
import xlsx from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updateThaiMismatch() {
    console.log("🚀 กำลังเตรียมอัปเดตข้อมูลนักศึกษาไทย (แก้ is_verified และเพิ่ม note)...\n");

    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    // ใช้การอ่านแบบ Dynamic หาไฟล์ล่าสุด
    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ ไม่พบไฟล์แบ็คอัพ Firebase ในโฟลเดอร์ ./Firebase");
        return;
    }
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // กำหนดเงื่อนไขลำดับ
    const group1Indices = [19, 20, 21, 30];
    const group2Indices = [29];

    let mismatchCount = 0;
    let updateCount = 0;
    const batch = db.batch();

    for (const row of studentList) {
        const excelStudentId = String(row[1]).trim();
        const excelFirstName = String(row[2] || '').trim();
        const excelMiddleName = String(row[3] || '').trim();
        const excelLastName = String(row[4] || '').trim();

        if (!excelStudentId || excelStudentId === 'undefined') continue;

        const matchingFbUsersById = firebaseUsersArray.filter(u => String(u.studentId).trim() === excelStudentId);

        if (matchingFbUsersById.length > 0) {
            let foundExactMatch = false;

            for (const fbUser of matchingFbUsersById) {
                const fbFirstName = (fbUser.firstName || '').trim();
                const fbMiddleName = (fbUser.middleName || '').trim();
                const fbLastName = (fbUser.lastName || '').trim();

                if (fbFirstName === excelFirstName && fbMiddleName === excelMiddleName && fbLastName === excelLastName) {
                    foundExactMatch = true;
                }
            }

            // ถ้ารหัสตรง แต่ชื่อไม่เป๊ะ (เข้าข่าย mismatch)
            if (!foundExactMatch) {
                for (const fbUser of matchingFbUsersById) {
                    mismatchCount++;

                    // กลุ่มที่ 1: ชื่อกลางไม่ถูกต้อง
                    if (group1Indices.includes(mismatchCount)) {
                        console.log(`✅ [กลุ่ม 1] เตรียมอัปเดตลำดับที่ ${mismatchCount} - รหัส: ${excelStudentId}`);
                        const userRef = db.collection('users').doc(fbUser.id);
                        batch.update(userRef, {
                            is_verified: true,
                            note: "ไทย ชื่อกลางไม่ถูกต้อง"
                        });
                        updateCount++;
                    }
                    
                    // กลุ่มที่ 2: ชื่อไม่ถูกต้อง
                    if (group2Indices.includes(mismatchCount)) {
                        console.log(`✅ [กลุ่ม 2] เตรียมอัปเดตลำดับที่ ${mismatchCount} - รหัส: ${excelStudentId}`);
                        const userRef = db.collection('users').doc(fbUser.id);
                        batch.update(userRef, {
                            is_verified: true,
                            note: "ไทย ชื่อไม่ถูกต้อง"
                        });
                        updateCount++;
                    }
                }
            }
        }
    }

    if (updateCount > 0) {
        console.log(`\n⏳ กำลังส่งข้อมูลขึ้น Firebase จำนวน ${updateCount} รายการ...`);
        try {
            await batch.commit();
            console.log("🎉 อัปเดตข้อมูลเรียบร้อยแล้ว!");
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดระหว่างอัปเดต Firebase:", error);
        }
    } else {
        console.log("ℹ️ ไม่พบรายการใดที่ตรงกับเงื่อนไข หรืออัปเดตไปหมดแล้ว");
    }
}

updateThaiMismatch();
