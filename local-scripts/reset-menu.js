import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../apps/student-reg/.env.backend') });

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

const LINE_USER_ID = [
    "Ucb5e5eae10d8a03c5901a9c37ca53447", // โบ
    "U639762d7e2dc60e6f184700fc9de7aa7", // พิพัฒน์พงศ์
];

async function resetRichMenu() {
    if (!LINE_ACCESS_TOKEN) {
        console.error('กรุณาระบุ LINE_ACCESS_TOKEN')
        return;
    }

    console.log("กำลังรีเซ็ท Rich Menu...");

    let count = 1;

    for (const userId of LINE_USER_ID) {
        try {
            const response = await fetch(
                `https://api.line.me/v2/bot/user/${userId}/richmenu`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": "Bearer " + LINE_ACCESS_TOKEN
                    }
                }
            );

            if (response.ok) {
                console.log("สำเร็จครั้งที่", count);
            } else {
                const errorData = await response.json();
                console.log("ล้มเหลว เกิดข้อผิดพลาดครั้งที่", count, errorData);
            }

        } catch (error) {
            console.error("เกิดข้อผิดพลาดครั้งที่", count, error);
        }
        count++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("รีเซ็ท Rich Menu เสร็จสิ้น");
}

resetRichMenu();
