import fs from 'fs';
import xlsx from 'xlsx';

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function showShirtDiff() {
    console.log("🔍 กำลังดึงข้อมูล 15 คนที่เป็นส่วนต่างจาก Firebase...");

    // 1. อ่านข้อมูล Excel เพื่อเอามาเทียบ
    const workbook = xlsx.readFile('./student-id-name-lastname-1.xlsx');
    const sheetName = "รวมรายชื่อ";
    const sheetData = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheetData, { header: 1 });
    const studentList = rows.slice(1);

    // สร้าง Map เพื่อให้ค้นหาจาก Excel ได้เร็วขึ้น
    const excelMap = new Map();
    for (const row of studentList) {
        const id = String(row[1]).trim();
        if (id && id !== 'undefined') {
            excelMap.set(id, {
                firstName: String(row[2] || '').trim(),
                middleName: String(row[3] || '').trim(),
                lastName: String(row[4] || '').trim()
            });
        }
    }

    // 2. ดึงข้อมูลคนสั่งเสื้อทั้งหมดจาก Firebase แบบ Real-time
    const snapshot = await db.collection('users').where('is_shirt_ordered', '==', true).get();

    let diffCount = 0;

    console.log("\n==================================================");
    console.log("⚠️ รายชื่อคนสั่งเสื้อ (is_shirt_ordered=true) แต่ยังไม่ได้ยืนยันตัวตน (is_verified=false)");
    console.log("==================================================\n");

    snapshot.forEach(doc => {
        const fbUser = doc.data();
        
        // กรองหาคนที่เป็นส่วนต่าง (สั่งเสื้อแล้ว แต่ยังไม่ verify)
        if (fbUser.is_verified !== true) {
            diffCount++;
            const studentId = String(fbUser.studentId).trim();
            const fbFirstName = (fbUser.firstName || '').trim();
            const fbMiddleName = (fbUser.middleName || '').trim();
            const fbLastName = (fbUser.lastName || '').trim();

            const fbFullName = `${fbFirstName} ${fbMiddleName} ${fbLastName}`.replace(/\s+/g, ' ').trim();
            
            console.log(`👤 ลำดับที่ ${diffCount}`);
            console.log(`   รหัสนักศึกษา: ${studentId}`);
            console.log(`   ข้อมูลใน Web : ${fbFullName}`);

            // หาข้อมูลใน Excel มาเทียบ
            if (excelMap.has(studentId)) {
                const ex = excelMap.get(studentId);
                const exFullName = `${ex.firstName} ${ex.middleName} ${ex.lastName}`.replace(/\s+/g, ' ').trim();
                console.log(`   ข้อมูลใน Excel: ${exFullName}`);
            } else {
                console.log(`   ข้อมูลใน Excel: ❌ ไม่พบรหัสนี้ในไฟล์ Excel`);
            }
            
            // ปริ้นไอดีไลน์เผื่อทักไปหา
            const lineId = fbUser.lineUserId || fbUser.line_user_id || 'ไม่มีข้อมูล';
            console.log(`   🆔 LINE User ID: ${lineId}`);
            console.log("--------------------------------------------------");
        }
    });

    console.log(`\n✅ พบส่วนต่างทั้งหมด: ${diffCount} คน`);
    console.log("==================================================\n");
    process.exit(0);
}

showShirtDiff();
