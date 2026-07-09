import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 1. เชื่อมต่อ Firebase
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function pullData() {
    console.log("⏳ กำลังดูดข้อมูลทั้งหมดจาก Firebase...");

    // (จุดสังเกต: Collection ใน Firebase ต้องเติม s ด้วยนะครับ เป็น 'users')
    const snapshot = await db.collection('users').get();

    // แปลงข้อมูลเป็น Array ของ Object
    const usersData = [];
    snapshot.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() });
    });

    // 2. สร้างโฟลเดอร์ชื่อ Firebase (ถ้ายังไม่มี)
    const folderPath = './Firebase';
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    // 3. สร้างชื่อไฟล์ตาม วัน-เวลา ปัจจุบัน (เช่น 2026-06-20_01-30-45.json)
    const now = new Date();
    const timeString = now.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace(/[: ]/g, '-');
    const fileName = `${timeString}.json`;
    const filePath = path.join(folderPath, fileName);

    // 4. เซฟลงไฟล์
    fs.writeFileSync(filePath, JSON.stringify(usersData, null, 2), 'utf8');

    console.log(`✅ ดูดข้อมูลสำเร็จ ${usersData.length} คน!`);
    console.log(`📁 เซฟไฟล์ไว้ที่: Firebase/${fileName}`);
}

pullData();
