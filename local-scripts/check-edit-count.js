import fs from 'fs';

function checkEditCount() {
    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    const users = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    const noIdUsers = users.filter(u => u.studentId === '69070500000' || u.studentIdStatus === 'ยังไม่ได้รับรหัสนักศึกษา');
    
    let count0 = 0;
    let count1 = 0;
    let count2 = 0;
    const editedUsers = [];

    noIdUsers.forEach(u => {
        const edits = u.editCount || 0;
        if (edits === 0) count0++;
        else if (edits === 1) count1++;
        else if (edits >= 2) count2++;
        
        if (edits > 0) {
            editedUsers.push(u);
        }
    });

    console.log("======================================");
    console.log(`จำนวนคนที่ "ยังไม่ได้รับรหัสนักศึกษา" ทั้งหมด: ${noIdUsers.length} คน`);
    console.log(`- Edit Count เป็น 0 จำนวน: ${count0} คน`);
    console.log(`- Edit Count เป็น 1 จำนวน: ${count1} คน`);
    console.log(`- Edit Count เป็น 2 (หรือมากกว่า) จำนวน: ${count2} คน`);
    console.log("======================================");

    if (editedUsers.length > 0) {
        console.log("\n⚠️ รายชื่อคนที่มี Edit Count > 0:");
        editedUsers.forEach(u => {
            console.log(`- [Edit: ${u.editCount || 0}] ${u.firstName} ${u.lastName} (Verify แล้ว: ${u.is_verified ? 'ใช่' : 'ไม่ใช่'})`);
        });
    } else {
        console.log("\n✅ ทุกคนที่ยังไม่มีรหัสนักศึกษา มี Edit count เป็น 0 ทั้งหมดครับ!");
    }
}

checkEditCount();
