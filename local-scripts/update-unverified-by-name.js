import fs from 'fs';
import xlsx from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updateUnverifiedByName() {
    console.log("🚀 กำลังเตรียมอัปเดตผู้ใช้ที่ยังไม่ได้ Verify โดยอิงจาก 'ชื่อจริงและนามสกุล' ที่ตรงกับ Excel...\n");

    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    // ดึงไฟล์ Backup ล่าสุดแบบอัตโนมัติ
    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ ไม่พบไฟล์แบ็คอัพ Firebase ในโฟลเดอร์ ./Firebase");
        return;
    }
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // กรองเอาเฉพาะคนที่ยังไม่ได้ Verify
    const unverifiedUsers = firebaseUsersArray.filter(u => u.is_verified !== true);

    let updateCount = 0;
    const batches = [];
    let currentBatch = db.batch();
    let currentOperationCount = 0;

    for (const fbUser of unverifiedUsers) {
        const fbFirstName = String(fbUser.firstName || '').trim();
        const fbLastName = String(fbUser.lastName || '').trim();
        const fbStudentId = String(fbUser.studentId || '').trim();

        if (!fbFirstName || !fbLastName) continue;

        // หาแถวใน Excel ที่ชื่อจริงและนามสกุลตรงกันเป๊ะ
        const matchedExcelRows = studentList.filter(row => {
            const excelFirstName = String(row[2] || '').trim();
            const excelLastName = String(row[4] || '').trim();
            return excelFirstName === fbFirstName && excelLastName === fbLastName;
        });

        // อัปเดตเฉพาะคนที่เจอชื่อ-นามสกุลตรงกันใน Excel (และเจอแค่ 1 คนเท่านั้น เพื่อป้องกันคนชื่อนามสกุลซ้ำกันพอดี)
        if (matchedExcelRows.length === 1) {
            const row = matchedExcelRows[0];
            const excelStudentId = String(row[1]).trim();

            console.log(`✅ พบเป้าหมาย (UID: ${fbUser.id})`);
            console.log(`   ชื่อ: ${fbFirstName} ${fbLastName}`);
            console.log(`   รหัสเดิม: ${fbStudentId} => รหัสใหม่: ${excelStudentId}`);
            console.log("--------------------------------------------------");

            const userRef = db.collection('users').doc(fbUser.id);
            currentBatch.update(userRef, {
                is_verified: true,
                studentId: excelStudentId,
                note: "อัปเดตผ่านการจับคู่ ชื่อ-นามสกุล และแก้ไขรหัสนักศึกษาอัตโนมัติ"
            });

            updateCount++;
            currentOperationCount++;

            // Chunk batch
            if (currentOperationCount === 500) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                currentOperationCount = 0;
            }
        }
    }

    if (currentOperationCount > 0) {
        batches.push(currentBatch);
    }

    if (updateCount > 0) {
        console.log(`\n⏳ กำลังส่งข้อมูลขึ้น Firebase จำนวน ${updateCount} รายการ (แบ่งเป็น ${batches.length} ก้อน)...`);
        try {
            for (let i = 0; i < batches.length; i++) {
                await batches[i].commit();
                console.log(`   - ส่งก้อนที่ ${i + 1}/${batches.length} สำเร็จ`);
            }
            console.log("🎉 อัปเดตข้อมูลนักศึกษา (เปลี่ยนรหัส และ Verify) เสร็จสมบูรณ์!");
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดระหว่างอัปเดต Firebase:", error);
        }
    } else {
        console.log("ℹ️ ไม่พบรายการใดที่สามารถอัปเดตได้ (ไม่มีใครที่ชื่อ-นามสกุลตรงกันเลย)");
    }
}

updateUnverifiedByName();
