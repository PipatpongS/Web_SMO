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

// ใส่ User ID ที่ต้องการทักไป
const TARGET_UID = 'Udf3954bae4f3b2460bde6d29a16296c9';

async function sendMessage() {
    const messageData = {
        to: TARGET_UID,
        messages: [
            {
                type: "text",
                text: "สวัสดีครับ จากทีมงานสโมสรนักศึกษาคณะวิศวกรรมศาสตร์ ⚙️🐜\n\n⚠️ ตรวจพบว่าข้อมูลไม่ตรงกับทะเบียนมหาวิทยาลัย (รหัสนักศึกษา)\n\n📌 โปรดเข้าไปแก้ไขก่อน 1 ก.ค. 2569 เวลา 23:59 น.\n\n👇 คำอธิบายปุ่มกด\n📝 ไปหน้าแก้ไข: กดเพื่อไปยังหน้าเว็บ\n✅ แก้ไขแล้ว: แจ้งแอดมินว่าอัปเดตข้อมูลแล้ว\n❌ แจ้งเตือนผิดพลาด: แจ้งแอดมินว่าข้อมูลถูกต้องอยู่แล้ว"
            },
            {
                type: "template",
                altText: "แจ้งเตือนแก้ไขข้อมูล",
                template: {
                    type: "buttons",
                    text: "ตรวจสอบข้อมูลและแจ้งแอดมิน 👇\n\nกดปุ่มด้านล่างเพื่อตอบกลับ:",
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
                            label: "❌ แจ้งเตือนผิดพลาด",
                            text: "การแจ้งเตือนผิดพลาดครับ/ค่ะ ข้อมูลของฉันถูกต้องอยู่แล้ว"
                        }
                    ]
                }
            }
        ]
    };

    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            },
            body: JSON.stringify(messageData)
        });

        if (response.ok) {
            console.log("✅ ส่งข้อความสำเร็จแล้ว! รอน้องตอบกลับในแชท LINE OA ได้เลยครับ");

            // รีเซ็ต editCount เป็น 0 บน Firestore
            try {
                const userRef = db.collection('users').doc(TARGET_UID);
                await userRef.update({ editCount: 0 });
                console.log(`✅ รีเซ็ต editCount เป็น 0 ให้กับผู้ใช้ ${TARGET_UID} เรียบร้อยแล้ว!`);
            } catch (firestoreErr) {
                console.error(`❌ เกิดข้อผิดพลาดในการรีเซ็ต editCount ให้ผู้ใช้ ${TARGET_UID}:`, firestoreErr);
            }

        } else {
            const error = await response.json();
            console.log("❌ ส่งข้อความล้มเหลว:", error);
        }
    } catch (err) {
        console.error("❌ เกิดข้อผิดพลาด:", err);
    }
}

sendMessage();
