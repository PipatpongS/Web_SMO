import fs from 'fs';
import xlsx from 'xlsx';

async function checkVerifiedMismatch() {
    console.log("🔍 กำลังตรวจสอบข้อมูลของคนที่ 'Verify แล้ว' ว่าตรงกับ Excel ทุกจุดหรือไม่...\n");

    // 1. อ่านข้อมูล Excel
    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    // สร้าง Map เพื่อให้ค้นหาตามรหัสนักศึกษาได้เร็วขึ้น
    const excelMap = new Map();
    for (const row of studentList) {
        const id = String(row[1] || '').trim();
        if (id) {
            excelMap.set(id, {
                firstName: String(row[2] || '').trim(),
                middleName: String(row[3] || '').trim(),
                lastName: String(row[4] || '').trim(),
                department: String(row[5] || '').trim(),
            });
        }
    }

    // 2. ดึงไฟล์ Backup ล่าสุดแบบอัตโนมัติ
    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ ไม่พบไฟล์แบ็คอัพ Firebase ในโฟลเดอร์ ./Firebase");
        return;
    }
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    console.log(`กำลังอ่านข้อมูลจากไฟล์: ${latestFile}\n`);
    
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // กรองเอาเฉพาะคนที่ "Verify แล้ว"
    const verifiedUsers = firebaseUsersArray.filter(u => u.is_verified === true);
    
    console.log(`👥 พบคนที่ Verify แล้วทั้งหมด: ${verifiedUsers.length} คน`);
    console.log("กำลังตรวจสอบ...\n");
    console.log("--------------------------------------------------");

    let errorCount = 0;

    for (const fbUser of verifiedUsers) {
        const fbStudentId = String(fbUser.studentId || '').trim();
        const fbFirstName = String(fbUser.firstName || '').trim();
        const fbMiddleName = String(fbUser.middleName || '').trim();
        const fbLastName = String(fbUser.lastName || '').trim();
        const fbDepartment = String(fbUser.department || '').trim();

        const excelData = excelMap.get(fbStudentId);

        if (!excelData) {
            errorCount++;
            console.log(`⚠️ ลำดับความผิดปกติที่ ${errorCount}`);
            console.log(`   ❌ ไม่พบรหัสนักศึกษา ${fbStudentId} ในไฟล์ Excel!`);
            console.log(`   🌐 ข้อมูลใน Web: [รหัส: ${fbStudentId}] [ภาค: ${fbDepartment}] ${fbFirstName} ${fbMiddleName} ${fbLastName}`);
            console.log(`   🆔 LINE UID    : ${fbUser.id}`);
            console.log("--------------------------------------------------");
            continue;
        }

        const mismatches = [];
        if (fbFirstName !== excelData.firstName) mismatches.push('ชื่อจริง');
        if (fbMiddleName !== excelData.middleName) mismatches.push('ชื่อกลาง');
        if (fbLastName !== excelData.lastName) mismatches.push('นามสกุล');
        
        // เราจะไม่เอาคำว่า "ภาควิชา" และ "วิศวกรรม" มาเป็นตัวตัดสินเผื่อพิมพ์ตกหล่น แต่จะเช็ค String ง่ายๆ ก่อน
        // ถ้าซีเรียสเรื่องเว้นวรรค ให้ตัดเว้นวรรคออกก่อนเทียบ
        const fbDeptClean = fbDepartment.replace(/\s+/g, '');
        const exDeptClean = excelData.department.replace(/\s+/g, '');
        if (fbDeptClean !== exDeptClean) mismatches.push('ภาควิชา');

        if (mismatches.length > 0) {
            errorCount++;
            console.log(`⚠️ ลำดับความผิดปกติที่ ${errorCount}`);
            console.log(`   🚨 ส่วนที่ไม่ตรงกัน: ${mismatches.join(', ')}`);
            console.log(`   🌐 ข้อมูลใน Web: [ภาค: ${fbDepartment}] ${fbFirstName} ${fbMiddleName} ${fbLastName}`);
            console.log(`   📊 ข้อมูล Excel : [ภาค: ${excelData.department}] ${excelData.firstName} ${excelData.middleName} ${excelData.lastName}`);
            console.log(`   🆔 LINE UID    : ${fbUser.id}`);
            console.log("--------------------------------------------------");
        }
    }

    console.log(`\n====== 📝 สรุป ======`);
    console.log(`ตรวจสอบคน Verify ทั้งหมด: ${verifiedUsers.length} คน`);
    if (errorCount === 0) {
        console.log(`✅ ยอดเยี่ยมมาก! ทุกคนที่ Verify ข้อมูลตรงกับ Excel 100% ครับ`);
    } else {
        console.log(`❌ พบคนที่มีข้อมูลไม่ตรงกับ Excel ทั้งหมด: ${errorCount} คน`);
        console.log(`(รายชื่ออยู่ด้านบน สามารถนำ UID ไปแจ้งหรือแก้ไขได้)`);
    }
    console.log(`=====================\n`);
}

checkVerifiedMismatch();
