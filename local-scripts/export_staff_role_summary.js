import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function run() {
  let serviceAccountFile = './serviceAccountKey.json';
  
  if (!fs.existsSync(serviceAccountFile)) {
    try {
      const files = fs.readdirSync('.');
      const adminSdkFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      if (adminSdkFile) {
        serviceAccountFile = `./${adminSdkFile}`;
      }
    } catch (e) {}
  }
  
  if (!fs.existsSync(serviceAccountFile)) {
    console.error('❌ Error: ไม่พบไฟล์คีย์ Firebase (serviceAccountKey.json หรือไฟล์ firebase-adminsdk-*.json)');
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountFile);

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    const db = getFirestore();

    console.log('⏳ กำลังดึงข้อมูลจากคอลเลกชัน "staff_applicants"...');
    const staffSnapshot = await db.collection('staff_applicants').get();
    
    // Grouping nicknames by role1
    const roleGroups = {};
    staffSnapshot.forEach(doc => {
      const data = doc.data();
      
      // กรอง line_displayName "Rak" ออกตามที่ขอ
      if (data.line_displayName === 'Rak') return;

      const role = data.role1 || 'ไม่ระบุฝ่าย';
      // ดึงเฉพาะชื่อเล่น (หากไม่มีให้ใช้ชื่อจริงแทน)
      const nickname = data.nickname || data.firstName || 'ไม่ระบุชื่อ';

      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      
      roleGroups[role].push(nickname.trim());
    });

    // ดึงรายชื่อฝ่ายทั้งหมดแล้วเรียงลำดับ
    const roles = Object.keys(roleGroups).sort();
    
    // หาจำนวนแถวสูงสุดในฝ่ายเพื่อใช้สร้างตาราง
    const maxRows = Math.max(...roles.map(r => roleGroups[r].length));

    const csvRows = [];
    
    // 1. ใส่หัวตารางเป็นชื่อฝ่ายและระบุจำนวนคนแยกตามคอลัมน์
    csvRows.push(roles.map(r => `"${r} (${roleGroups[r].length} คน)"`).join(','));

    // 2. ใส่รายชื่อเล่นลงในแต่ละแถวภายใต้ฝ่ายนั้นๆ
    for (let i = 0; i < maxRows; i++) {
      const row = roles.map(role => {
        const name = roleGroups[role][i];
        return name ? `"${name.replace(/"/g, '""')}"` : '""';
      });
      csvRows.push(row.join(','));
    }

    // ใช้ UTF-8 with BOM (\ufeff) เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
    const csvString = '\ufeff' + csvRows.join('\r\n');
    fs.writeFileSync('./staff_role_summary.csv', csvString, 'utf8');
    
    console.log(`\n📊 สรุปข้อมูลแยกเซลล์ชื่อเล่นเรียบร้อยแล้ว!`);
    roles.forEach(role => {
      console.log(`- ฝ่าย ${role} (${roleGroups[role].length} คน): ${roleGroups[role].join(', ')}`);
    });
    console.log(`\n✅ ส่งออกไฟล์สำเร็จ! -> ./staff_role_summary.csv`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    process.exit(0);
  }
}

run();
