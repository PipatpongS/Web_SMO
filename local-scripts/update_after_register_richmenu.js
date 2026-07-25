import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load LINE Access Token
dotenv.config({ path: path.resolve('../apps/staff-reg/.env.backend') });
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

if (!LINE_ACCESS_TOKEN) {
  console.error("❌ LINE_ACCESS_TOKEN is missing in .env.backend");
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync('./smo-vidva-bangmod-firebase-adminsdk-fbsvc-247d2f79cd.json', 'utf8')
);
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

const IMAGE_PATH = path.resolve('../apps/student-reg/api/Richmenu_3.jpg');

async function updateRichMenuAndLinkUsers() {
  console.log("1️⃣ Reading local Rich Menu image from Richmenu_3.jpg...");
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`❌ Image file not found at: ${IMAGE_PATH}`);
    process.exit(1);
  }

  const imgBuffer = fs.readFileSync(IMAGE_PATH);
  const contentType = 'image/jpeg';
  console.log(`✅ Loaded image successfully (${imgBuffer.length} bytes, type: ${contentType})`);

  console.log("2️⃣ Creating new Rich Menu object with 5 areas...");
  const newMenuBody = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Menu After Register V3 (5 Options)",
    chatBarText: "เมนู / Menu",
    areas: [
      {
        // 1. Profile (Left area: x=0 to 863)
        bounds: { x: 0, y: 0, width: 863, height: 1686 },
        action: {
          type: "uri",
          uri: "https://liff.line.me/2010390110-fPHy5j81/profile"
        }
      },
      {
        // 2. Activity Details (Top Mid: x=863 to 1641, y=0 to 847)
        bounds: { x: 863, y: 0, width: 778, height: 847 },
        action: {
          type: "uri",
          uri: "https://liff.line.me/2010390110-fPHy5j81/activity-details"
        }
      },
      {
        // 3. Instagram (Top Right: x=1641 to 2500, y=0 to 847)
        bounds: { x: 1641, y: 0, width: 859, height: 847 },
        action: {
          type: "uri",
          uri: "https://www.instagram.com/samovidva_bangmod?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
        }
      },
      {
        // 4. Activity Feedback Form (Bottom Mid: x=863 to 1641, y=847 to 1686)
        bounds: { x: 863, y: 847, width: 778, height: 839 },
        action: {
          type: "uri",
          uri: "https://forms.gle/PFmpfJBJGdDakLZV7"
        }
      },
      {
        // 5. Expectation Survey (Bottom Right: x=1641 to 2500, y=847 to 1686)
        bounds: { x: 1641, y: 847, width: 859, height: 839 },
        action: {
          type: "uri",
          uri: "https://docs.google.com/forms/d/e/1FAIpQLSfN4UIaL_N2rtELHe4upn-Qby-PVuI8xNApYvAJ5V7Q_w6oRA/viewform?usp=sharing&ouid=105246602615321610585"
        }
      }
    ]
  };

  const createRes = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newMenuBody)
  });

  if (!createRes.ok) {
    console.error("❌ Failed to create new Rich Menu:", await createRes.text());
    process.exit(1);
  }

  const { richMenuId: newRichMenuId } = await createRes.json();
  console.log(`✅ Created new Rich Menu! ID: ${newRichMenuId}`);

  console.log("3️⃣ Uploading Richmenu_3.jpg image to new Rich Menu...");
  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${newRichMenuId}/content`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
      "Content-Type": contentType
    },
    body: imgBuffer
  });

  if (!uploadRes.ok) {
    console.error("❌ Failed to upload image to new Rich Menu:", await uploadRes.text());
    process.exit(1);
  }
  console.log("✅ Image uploaded to new Rich Menu successfully!");

  console.log("4️⃣ Fetching all user UIDs from Firestore 'users' collection...");
  const usersSnapshot = await db.collection('users').get();
  const userIds = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const uid = data.line_uid || doc.id;
    if (uid && uid.startsWith('U')) {
      userIds.push(uid);
    }
  });

  console.log(`Found ${userIds.length} valid LINE UIDs in Firestore.`);

  if (userIds.length === 0) {
    console.log("No users found to link.");
    return;
  }

  console.log(`5️⃣ Linking ${userIds.length} users to new Rich Menu (${newRichMenuId})...`);
  
  // LINE Batch Link supports up to 500 userIds per request
  const chunkSize = 500;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    const linkRes = await fetch("https://api.line.me/v2/bot/richmenu/bulk/link", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        richMenuId: newRichMenuId,
        userIds: chunk
      })
    });

    if (!linkRes.ok) {
      console.error(`❌ Batch link failed for chunk ${i}:`, await linkRes.text());
    } else {
      console.log(`✅ Linked chunk ${i / chunkSize + 1} (${chunk.length} users) successfully!`);
    }
  }

  console.log("\n🎉 ALL DONE!");
  console.log(`NEW AFTER_REGISTER_RICH_MENU_ID = ${newRichMenuId}`);
}

updateRichMenuAndLinkUsers().catch(err => console.error("Unhandled error:", err));
