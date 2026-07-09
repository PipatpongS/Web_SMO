import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ตั้งค่า Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// จับคู่ระหว่างค่าใน Firebase (ภาษาอังกฤษ) กับค่าที่ใช้โชว์ใน Terminal (ข้อความเต็ม)
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

async function showStats() {
    console.log("📊 กำลังดึงข้อมูลสถิติจาก Firebase ด้วย Aggregation Query (โหมดประหยัดโควต้าสุดๆ)...");
    
    let totalReads = 0;

    // ส่งคำสั่งนับยอดหลัก
    const totalReq = db.collection('users').count().get();
    const verifiedReq = db.collection('users').where('is_verified', '==', true).count().get();
    const shirtReq = db.collection('users').where('is_shirt_ordered', '==', true).count().get();
    
    // ส่งคำสั่งนับแยกรายไซซ์ (ใช้ตัวหนังสือภาษาอังกฤษในการหาใน Firebase)
    const sizeReqs = SIZE_MAPPINGS.map(size => 
        db.collection('users')
          .where('is_shirt_ordered', '==', true)
          .where('shirtSize', '==', size.dbValue)
          .count()
          .get()
    );

    // ยิงรวดเดียวพร้อมกันเพื่อความเร็ว
    const [totalRes, verifiedRes, shirtRes, ...sizesRes] = await Promise.all([
        totalReq, verifiedReq, shirtReq, ...sizeReqs
    ]);

    // คํานวณจำนวนการอ่าน
    // การใช้คำสั่ง count() 1 คำสั่ง = เสียโควต้า 1 Read
    // เราใช้ไป: รวมทั้งหมด(1) + ยืนยัน(1) + สั่งเสื้อ(1) + ไซซ์(11) = 14 คำสั่ง
    totalReads = 3 + SIZE_MAPPINGS.length; 

    const totalRegistered = totalRes.data().count;
    const verifiedCount = verifiedRes.data().count;
    const shirtOrderedCount = shirtRes.data().count;

    console.log("\n=================================");
    console.log(`📈 สรุปสถิติผู้ลงทะเบียน (อัปเดตล่าสุด)`);
    console.log("=================================");
    console.log(`👥 คนลงทะเบียนทั้งหมดในระบบ: ${totalRegistered} คน`);
    console.log(`✅ ยืนยันตัวตนแล้ว (is_verified = true): ${verifiedCount} คน`);
    console.log(`👕 สั่งเสื้อแล้วทั้งหมด: ${shirtOrderedCount} คน`);
    
    const unverifiedShirtOrders = Math.abs(shirtOrderedCount - verifiedCount);
    const noShirtOrders = totalRegistered - shirtOrderedCount;
    
    console.log(`   ↳ (ส่วนต่าง) คนที่สั่งเสื้อแล้ว แต่สถานะยังไม่ยืนยันตัวตน: ${unverifiedShirtOrders} คน`);
    console.log(`   ↳ (ส่วนต่าง) คนที่ลงทะเบียนแล้ว แต่ยังไม่ได้สั่งเสื้อ: ${noShirtOrders} คน`);
    
    console.log(`\n📦 สรุปยอดสั่งเสื้อแยกตามไซซ์:`);
    
    let sizeSum = 0;
    
    for (let i = 0; i < SIZE_MAPPINGS.length; i++) {
        const count = sizesRes[i].data().count;
        const displayStr = SIZE_MAPPINGS[i].display;
        sizeSum += count;
        // ปริ้นผลลัพธ์เป็นข้อความเต็มๆ
        console.log(`   - ${displayStr.padEnd(35, ' ')} : ${count} ตัว`);
    }
    
    console.log("\n---------------------------------");
    console.log(`📌 เอาทุกไซซ์มาบวกกันได้รวม: ${sizeSum} ตัว`);
    console.log(`📌 ยอดคนสั่งเสื้อรวมในระบบ: ${shirtOrderedCount} คน`);
    
    if (sizeSum === shirtOrderedCount) {
        console.log(`✅ สรุป: ยอดเสื้อทุกไซซ์รวมกัน "ตรงกันเป๊ะ 100%" กับจำนวนคนสั่งเสื้อทั้งหมด!`);
    } else {
        const diff = shirtOrderedCount - sizeSum;
        console.log(`⚠️ ข้อสังเกต: มียอดไม่เข้าพวกอยู่ ${diff} ตัว (นี่คือกลุ่มคนที่พิมพ์ไซซ์แปลกๆ หรือไม่ระบุครับ)`);
    }
    
    console.log("=================================");
    console.log(`⚡️ Firebase อ่านข้อมูลไปทั้งหมดเพียง: ${totalReads} Reads เท่านั้น! (ประหยัดขึ้นมาก!)`);
    console.log("=================================\n");
}

showStats();
