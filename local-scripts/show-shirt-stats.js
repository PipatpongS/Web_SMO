import fs from 'fs';

const SIZE_MAPPINGS = [
    { dbValue: 'SS', display: 'SS (รอบอก 36" / ความยาว 25")' },
    { dbValue: 'S', display: 'S (รอบอก 38" / ความยาว 26")' },
    { dbValue: 'M', display: 'M (รอบอก 40" / ความยาว 28")' },
    { dbValue: 'L', display: 'L (รอบอก 42" / ความยาว 28")' },
    { dbValue: 'XL', display: 'XL (รอบอก 44" / ความยาว 29")' },
    { dbValue: '2XL', display: '2XL (รอบอก 46" / ความยาว 30")' },
    { dbValue: '3XL', display: '3XL (รอบอก 48" / ความยาว 30")' },
    { dbValue: '4XL', display: '4XL (รอบอก 50" / ความยาว 30")' },
    { dbValue: '5XL', display: '5XL (รอบอก 52" / ความยาว 31")' },
    { dbValue: '6XL', display: '6XL (รอบอก 54" / ความยาว 32")' },
    { dbValue: '7XL', display: '7XL (รอบอก 56" / ความยาว 33")' }
];

function showShirtStats() {
    console.log("📊 กำลังดึงข้อมูลสถิติเสื้อจากไฟล์ Backup ล่าสุด (ไม่เสียโควต้า Firebase)...\n");

    const firebaseDir = './Firebase';
    const files = fs.readdirSync(firebaseDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ ไม่พบไฟล์แบ็คอัพ Firebase ในโฟลเดอร์ ./Firebase");
        return;
    }
    const latestFile = files.sort().reverse()[0];
    const backupFilePath = `${firebaseDir}/${latestFile}`;
    const firebaseUsersArray = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    let orderedCount = 0;
    let notOrderedCount = 0;

    const orderedStats = {};
    const notOrderedStats = {};
    const totalStats = {};

    // Initialize counters
    SIZE_MAPPINGS.forEach(size => {
        orderedStats[size.dbValue] = 0;
        notOrderedStats[size.dbValue] = 0;
        totalStats[size.dbValue] = 0;
    });

    let unknownOrdered = 0;
    let unknownNotOrdered = 0;

    for (const user of firebaseUsersArray) {
        const size = user.shirtSize;
        const isValidSize = SIZE_MAPPINGS.some(s => s.dbValue === size);

        if (user.is_shirt_ordered === true) {
            orderedCount++;
            if (isValidSize) {
                orderedStats[size]++;
                totalStats[size]++;
            } else {
                unknownOrdered++;
            }
        } else {
            notOrderedCount++;
            if (isValidSize) {
                notOrderedStats[size]++;
                totalStats[size]++;
            } else {
                unknownNotOrdered++;
            }
        }
    }

    console.log("=================================");
    console.log(`📈 สรุปสถิติการสั่งเสื้อ (จากทั้งหมด ${firebaseUsersArray.length} คน)`);
    console.log("=================================");
    console.log(`✅ สั่งเสื้อแล้วทั้งหมด: ${orderedCount} คน`);
    console.log(`❌ ยังไม่ได้สั่งเสื้อทั้งหมด: ${notOrderedCount} คน`);
    console.log("=================================\n");

    console.log(`📦 กลุ่มที่ 1: ยอดไซซ์คนที่ "สั่งเสื้อแล้ว" (${orderedCount} คน)`);
    let orderedSum = 0;
    SIZE_MAPPINGS.forEach(size => {
        console.log(`   - ${size.display.padEnd(35, ' ')} : ${orderedStats[size.dbValue]} ตัว`);
        orderedSum += orderedStats[size.dbValue];
    });
    if (unknownOrdered > 0) {
        console.log(`   - ⚠️ ไซซ์ไม่ระบุ / ไม่เข้าพวก               : ${unknownOrdered} ตัว`);
        orderedSum += unknownOrdered;
    }
    console.log(`   👉 รวมกลุ่มที่ 1: ${orderedSum} ตัว\n`);

    console.log(`📦 กลุ่มที่ 2: ยอดไซซ์คนที่ "ยังไม่ได้สั่งเสื้อ" (${notOrderedCount} คน)`);
    let notOrderedSum = 0;
    SIZE_MAPPINGS.forEach(size => {
        console.log(`   - ${size.display.padEnd(35, ' ')} : ${notOrderedStats[size.dbValue]} ตัว`);
        notOrderedSum += notOrderedStats[size.dbValue];
    });
    if (unknownNotOrdered > 0) {
        console.log(`   - ⚠️ ไซซ์ไม่ระบุ / ไม่เข้าพวก               : ${unknownNotOrdered} ตัว`);
        notOrderedSum += unknownNotOrdered;
    }
    console.log(`   👉 รวมกลุ่มที่ 2: ${notOrderedSum} ตัว\n`);

    console.log(`📦 กลุ่มที่ 3: สรุปยอดไซซ์รวมทั้งหมด (สั่งแล้ว + ยังไม่สั่ง)`);
    console.log("   (เพื่อนำไปเช็คความถูกต้องหรือคำนวณจำนวนเสื้อทั้งหมด)");
    let totalSum = 0;
    SIZE_MAPPINGS.forEach(size => {
        console.log(`   - ${size.display.padEnd(35, ' ')} : ${totalStats[size.dbValue]} ตัว`);
        totalSum += totalStats[size.dbValue];
    });
    const totalUnknown = unknownOrdered + unknownNotOrdered;
    if (totalUnknown > 0) {
        console.log(`   - ⚠️ ไซซ์ไม่ระบุ / ไม่เข้าพวก               : ${totalUnknown} ตัว`);
        totalSum += totalUnknown;
    }
    console.log(`   👉 รวมยอดเสื้อทุกตัวในระบบ: ${totalSum} ตัว\n`);

    console.log("---------------------------------");
    if (totalSum === firebaseUsersArray.length) {
        console.log(`✅ ยอดเสื้อรวมทั้งหมด (${totalSum} ตัว) "ตรงกัน 100%" กับจำนวนคนลงทะเบียนทั้งหมด (${firebaseUsersArray.length} คน)!`);
    } else {
        console.log(`⚠️ ยอดเสื้อรวม (${totalSum} ตัว) ไม่เท่ากับจำนวนคนลงทะเบียน (${firebaseUsersArray.length} คน)`);
    }
    console.log("---------------------------------\n");
}

showShirtStats();
