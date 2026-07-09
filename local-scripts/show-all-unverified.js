import fs from 'fs';

async function showAllUnverified() {
    console.log("🔍 กำลังดึงรายชื่อ 'ทุกคน' ที่ยังไม่ได้ Verify จากระบบ...\n");

    // ดึงไฟล์ Backup ล่าสุดแบบอัตโนมัติ
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

    // กรองเอาเฉพาะคนที่ยังไม่ได้ Verify
    const unverifiedUsers = firebaseUsersArray.filter(u => u.is_verified !== true);

    let count = 0;
    
    for (const fbUser of unverifiedUsers) {
        const fbStudentId = String(fbUser.studentId || '-').trim();
        const fbFirstName = String(fbUser.firstName || '-').trim();
        const fbMiddleName = String(fbUser.middleName || '').trim();
        const fbLastName = String(fbUser.lastName || '-').trim();
        const fbDepartment = String(fbUser.department || '-').trim();
        const fbLineName = String(fbUser.line_displayName || 'ไม่มีชื่อ LINE').trim();
        
        count++;
        console.log(`ลำดับที่ ${count}`);
        console.log(`   รหัสนักศึกษา : ${fbStudentId}`);
        console.log(`   ชื่อ-นามสกุล : ${fbFirstName} ${fbMiddleName} ${fbLastName}`);
        console.log(`   ภาควิชา     : ${fbDepartment}`);
        console.log(`   💬 ชื่อ LINE : ${fbLineName}`);
        console.log(`   🆔 LINE UID : ${fbUser.id}`);
        console.log("--------------------------------------------------");
    }

    console.log(`\n====== 📝 สรุป ======`);
    console.log(`รวมรายชื่อคนที่ยังไม่ได้ Verify ทั้งสิ้น: ${unverifiedUsers.length} คน`);
    console.log(`=====================\n`);
}

showAllUnverified();
