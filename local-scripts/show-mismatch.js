import fs from 'fs';
import xlsx from 'xlsx';

async function showMismatchStudents() {
    console.log("🔍 กำลังค้นหาคนที่มี 'รหัสนักศึกษาตรง' แต่ 'ชื่อ-นามสกุลไม่ตรง'...\n");

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
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    console.log(`กำลังอ่านข้อมูลจากไฟล์ล่าสุด: ${latestFile}\n`);
    
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    let mismatchCount = 0;

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

            // ถ้ารหัสตรง แต่เช็คทุกข้อมูลแล้ว "ไม่มีชื่อไหนตรงเป๊ะ 100% เลย"
            if (!foundExactMatch) {
                // เอาข้อมูลของคนแรกที่รหัสตรงมาโชว์ (เพราะอาจจะพิมพ์ผิดนิดเดียว)
                for (const fbUser of matchingFbUsersById) {
                    const fbFirstName = (fbUser.firstName || '').trim();
                    const fbMiddleName = (fbUser.middleName || '').trim();
                    const fbLastName = (fbUser.lastName || '').trim();

                    const diffs = [];
                    if (fbFirstName !== excelFirstName) diffs.push('ชื่อ');
                    if (fbMiddleName !== excelMiddleName) diffs.push('ชื่อกลาง');
                    if (fbLastName !== excelLastName) diffs.push('นามสกุล');

                    mismatchCount++;
                    console.log(`⚠️ ลำดับที่ ${mismatchCount}`);
                    console.log(`   รหัสนักศึกษา: ${excelStudentId}`);
                    console.log(`   ข้อมูลใน Excel: ${excelFirstName} ${excelMiddleName} ${excelLastName}`);
                    console.log(`   ข้อมูลใน Web : ${fbFirstName} ${fbMiddleName} ${fbLastName}`);
                    console.log(`   ❌ จุดที่ไม่ตรง: ${diffs.join(', ')}`);
                    console.log(`   🆔 LINE User ID สำหรับทักแชท: ${fbUser.id}`);
                    console.log("--------------------------------------------------");
                }
            }
        }
    }

    console.log(`\n====== 📝 สรุป ======`);
    console.log(`พบรายชื่อที่รหัสตรงแต่ชื่อพิมพ์คลาดเคลื่อนทั้งหมด: ${mismatchCount} รายการ`);
    console.log(`คุณสามารถนำ 🆔 LINE User ID ไปใส่ในไฟล์ send-message.js เพื่อทักไปเตือนน้องๆ ได้เลยครับ`);
    console.log(`=====================\n`);
}

showMismatchStudents();
