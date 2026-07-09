import fs from 'fs';

function checkIntersection() {
    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    const users = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    const unverified = users.filter(u => u.is_verified !== true);
    const noId = users.filter(u => u.studentId === '69070500000' || u.studentIdStatus === 'ยังไม่ได้รับรหัสนักศึกษา');
    const intersected = users.filter(u => u.is_verified !== true && (u.studentId === '69070500000' || u.studentIdStatus === 'ยังไม่ได้รับรหัสนักศึกษา'));

    const unverifiedButHasId = unverified.filter(u => u.studentId !== '69070500000' && u.studentIdStatus !== 'ยังไม่ได้รับรหัสนักศึกษา');
    const verifiedButNoId = noId.filter(u => u.is_verified === true);

    console.log("======================================");
    console.log(`1. คนที่ยังไม่ Verify ทั้งหมด: ${unverified.length} คน`);
    console.log(`2. คนที่ยังไม่ได้รับรหัสนักศึกษา ทั้งหมด: ${noId.length} คน`);
    console.log(`3. คนที่ 'ยังไม่ Verify' และ 'ยังไม่มีรหัส' (Intersection): ${intersected.length} คน`);
    console.log("======================================");

    if (unverifiedButHasId.length > 0) {
        console.log(`\n⚠️ มีคนที่ยังไม่ Verify จำนวน ${unverifiedButHasId.length} คน แต่ "มีรหัสนักศึกษาแล้ว" (ไม่ได้ Intersect 100%)`);
        console.log("ตัวอย่าง:");
        unverifiedButHasId.slice(0, 5).forEach(u => {
            console.log(` - รหัส: ${u.studentId}, ชื่อ: ${u.firstName} ${u.lastName}`);
        });
    } else {
        console.log(`\n✅ คนที่ยังไม่ Verify ทุกคน คือคนที่ยังไม่มีรหัสนักศึกษา (Intersect 100%)`);
    }

    if (verifiedButNoId.length > 0) {
        console.log(`\n⚠️ มีคนที่ Verify แล้ว จำนวน ${verifiedButNoId.length} คน แต่ "ยังไม่มีรหัสนักศึกษา" (รหัสเป็น 69070500000)`);
    }
}

checkIntersection();
