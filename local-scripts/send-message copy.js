import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8'));
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

// ดึง Token จากไฟล์ .env
dotenv.config({ path: path.resolve('../apps/student-reg/.env.backend') });
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

async function sendMessagesToMissingStudentIds() {
    console.log("🔍 กำลังค้นหาผู้ใช้ที่ยังไม่มีรหัสนักศึกษา...");

    // ดึงข้อมูลผู้ใช้ที่ studentIdStatus หรือ studentId ตรงกับเงื่อนไข
    const snapshot1 = await db.collection('users')
        .where('studentIdStatus', '==', 'ยังไม่ได้รับรหัสนักศึกษา')
        .get();
        
    const snapshot2 = await db.collection('users')
        .where('studentId', 'in', ['68070500000', '69070500000', 'ยังไม่ได้รับรหัสนักศึกษา', 'ยังไม่ได้รับรหัส นศ'])
        .get();

    const uniqueDocs = new Map();
    snapshot1.forEach(doc => uniqueDocs.set(doc.id, doc));
    snapshot2.forEach(doc => uniqueDocs.set(doc.id, doc));

    if (uniqueDocs.size === 0) {
        console.log("✅ ไม่พบผู้ใช้ที่เข้าเงื่อนไข");
        return;
    }

    const CHUNK_SIZE = 500;
    const allDocs = Array.from(uniqueDocs.values());

    console.log(`พบผู้ใช้ที่เข้าเงื่อนไขทั้งหมด ${allDocs.length} คน...`);

    for (let i = 0; i < allDocs.length; i += CHUNK_SIZE) {
        const chunkDocs = allDocs.slice(i, i + CHUNK_SIZE);
        const chunkUIDs = chunkDocs.map(doc => doc.data().line_uid || doc.id);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;

        console.log(`กำลังประมวลผลกลุ่มที่ ${chunkNumber} (${chunkUIDs.length} คน)...`);

        const messageData = {
            to: chunkUIDs,
            messages: [
                {
                    type: "text",
                    text: "สวัสดีครับ จากทีมงานสโมสรนักศึกษาคณะวิศวกรรมศาสตร์ ⚙️🐜\n\n📌 หากนักศึกษาได้รับรหัสนักศึกษาแล้ว โปรดเข้าไปแก้ไขข้อมูลให้ถูกต้อง ก่อนวันที่ 1 ก.ค. 2569 เวลา 23:59 น.\n\n👇 คำอธิบายปุ่มกด\n📝 ไปหน้าแก้ไข: กดเพื่อไปยังหน้าเว็บ\n✅ แก้ไขแล้ว: แจ้งแอดมินว่าอัปเดตข้อมูลแล้ว\n❌ ยังไม่ได้รหัส นศ: แจ้งแอดมินว่ายังไม่ได้รับรหัสนักศึกษา"
                },
                {
                    type: "template",
                    altText: "แจ้งเตือนอัปเดตรหัสนักศึกษา",
                    template: {
                        type: "buttons",
                        text: "โปรดตรวจสอบและแจ้งแอดมิน 👇\n\nกดปุ่มด้านล่างเพื่อตอบกลับ:",
                        actions: [
                            {
                                type: "uri",
                                label: "📝 ไปหน้าแก้ไข",
                                // 🔴 เปลี่ยน URL ตรงนี้เป็นเว็บลงทะเบียนของจริงนะครับ
                                uri: "https://orientation-vidva-bangmod-67-alpha.vercel.app/profile"
                            },
                            {
                                type: "message",
                                label: "✅ แก้ไขแล้ว",
                                text: "ฉันได้เข้าไปแก้ไขข้อมูลเรียบร้อยแล้วครับ/ค่ะ"
                            },
                            {
                                type: "message",
                                label: "❌ ยังไม่ได้รหัส นศ.",
                                text: "ยังไม่ได้รับรหัสนักศึกษาครับ/ค่ะ"
                            }
                        ]
                    }
                }
            ]
        };

        try {
            // ใช้ endpoint multicast ส่งทีละกลุ่ม (กลุ่มละไม่เกิน 500 คนตามลิมิตของ LINE)
            const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                console.log(`✅ ส่งข้อความกลุ่มที่ ${chunkNumber} สำเร็จ!`);

                // อัปเดต editCount = 0 ให้กลุ่มนี้
                const batch = db.batch();
                chunkDocs.forEach(doc => {
                    batch.update(doc.ref, { editCount: 0 });
                });
                await batch.commit();

                console.log(`✅ รีเซ็ต editCount เป็น 0 ให้กับกลุ่มที่ ${chunkNumber} เรียบร้อยแล้ว!`);
            } else {
                const error = await response.json();
                console.log(`❌ ส่งข้อความกลุ่มที่ ${chunkNumber} ล้มเหลว (เช่น อาจจะตัน limit โควต้าข้อความ):`, error);
                console.log(`⚠️ รายชื่อ UID ของน้องๆ ในกลุ่มที่ ${chunkNumber} ที่ยังไม่ได้รับข้อความ (นำไปส่งใหม่ทีหลังได้):`);
                console.log(JSON.stringify(chunkUIDs, null, 2));
            }
        } catch (err) {
            console.error(`❌ เกิดข้อผิดพลาดในกลุ่มที่ ${chunkNumber}:`, err);
            console.log(`⚠️ รายชื่อ UID ของน้องๆ ในกลุ่มที่ ${chunkNumber} ที่ยังไม่ได้รับข้อความ (นำไปส่งใหม่ทีหลังได้):`);
            console.log(JSON.stringify(chunkUIDs, null, 2));
        }
    }

    console.log("🎉 ดำเนินการทั้งหมดเสร็จสิ้น!");
}

sendMessagesToMissingStudentIds();
