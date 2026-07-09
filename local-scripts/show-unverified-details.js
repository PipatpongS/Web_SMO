import fs from 'fs';
import xlsx from 'xlsx';

async function showUnverifiedDetails() {
    console.log("🔍 กำลังดึงข้อมูลคนที่ 'ยังไม่ได้ Verify' และเทียบข้อมูลกับ Excel...\n");

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
    console.log(`กำลังอ่านข้อมูลจากไฟล์: ${latestFile}`);
    
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // กรองเอาเฉพาะคนที่ยังไม่ได้ Verify
    const unverifiedUsers = firebaseUsersArray.filter(u => u.is_verified !== true);
    
    console.log(`พบคนที่ยังไม่ได้ Verify ทั้งหมด: ${unverifiedUsers.length} คน\n`);
    console.log("--------------------------------------------------");

    let matchCount = 0;

    for (const fbUser of unverifiedUsers) {
        const fbStudentId = String(fbUser.studentId || '').trim();
        const fbFirstName = String(fbUser.firstName || '').trim();
        const fbMiddleName = String(fbUser.middleName || '').trim();
        const fbLastName = String(fbUser.lastName || '').trim();
        const fbDepartment = String(fbUser.department || '').trim();

        // ค้นหาใน Excel ว่ามีใครที่ ชื่อ หรือ นามสกุล หรือ รหัส ตรงกันบ้าง
        // โดยใช้ระบบให้คะแนน (Score) เพื่อหาคนที่น่าจะเป็นคนๆ เดียวกันมากที่สุด
        let bestMatchRow = null;
        let bestMatchScore = 0;
        let matchedPartsForBest = [];

        for (const row of studentList) {
            const excelStudentId = String(row[1]).trim();
            const excelFirstName = String(row[2] || '').trim();
            const excelMiddleName = String(row[3] || '').trim();
            const excelLastName = String(row[4] || '').trim();
            const excelDepartment = String(row[5] || '').trim();

            let currentScore = 0;
            const matchedParts = [];

            if (fbStudentId && fbStudentId === excelStudentId) {
                currentScore += 3; // รหัสตรงให้คะแนนเยอะสุด
                matchedParts.push('รหัสนักศึกษา');
            }
            if (fbFirstName && fbFirstName === excelFirstName) {
                currentScore += 2;
                matchedParts.push('ชื่อจริง');
            }
            if (fbMiddleName && fbMiddleName === excelMiddleName) {
                currentScore += 1;
                matchedParts.push('ชื่อกลาง');
            }
            if (fbLastName && fbLastName === excelLastName) {
                currentScore += 2;
                matchedParts.push('นามสกุล');
            }
            if (fbDepartment && fbDepartment === excelDepartment) {
                currentScore += 1;
                matchedParts.push('ภาควิชา');
            }

            if (currentScore > bestMatchScore) {
                bestMatchScore = currentScore;
                bestMatchRow = { excelStudentId, excelFirstName, excelMiddleName, excelLastName, excelDepartment };
                matchedPartsForBest = matchedParts;
            }
        }

        // ถ้ามีส่วนใดส่วนหนึ่งตรงอย่างน้อย 1 อย่าง (เช่น ตรงแค่ชื่อ หรือ ตรงแค่นามสกุล)
        if (bestMatchScore > 0) {
            matchCount++;
            console.log(`⚠️ ลำดับที่ ${matchCount}`);
            console.log(`   🌐 ข้อมูลใน Web: [รหัส: ${fbStudentId}] [ภาค: ${fbDepartment}] ${fbFirstName} ${fbMiddleName} ${fbLastName}`);
            console.log(`   📊 ข้อมูล Excel : [รหัส: ${bestMatchRow.excelStudentId}] [ภาค: ${bestMatchRow.excelDepartment}] ${bestMatchRow.excelFirstName} ${bestMatchRow.excelMiddleName} ${bestMatchRow.excelLastName}`);
            console.log(`   ✅ ส่วนที่ตรงกัน : ${matchedPartsForBest.join(', ')}`);
            console.log(`   🆔 LINE UID    : ${fbUser.id}`);
            console.log("--------------------------------------------------");
        }
    }

    console.log(`\n====== 📝 สรุป ======`);
    console.log(`รวมคนที่ยังไม่ได้ Verify ทั้งหมด: ${unverifiedUsers.length} คน`);
    console.log(`พบว่ามีคนที่มีข้อมูลตรงกับ Excel บางส่วน: ${matchCount} คน`);
    console.log(`(อีก ${unverifiedUsers.length - matchCount} คน คือคนที่กรอกข้อมูลมาไม่ตรงกับ Excel เลยแม้แต่นิดเดียว หรือเป็น User เปล่าๆ)`);
    console.log(`=====================\n`);
}

showUnverifiedDetails();
