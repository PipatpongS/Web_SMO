import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);

async function run() {
  let serviceAccountFile = './serviceAccountKey.json';
  
  // ค้นหาไฟล์คีย์อัตโนมัติในโฟลเดอร์ปัจจุบัน
  if (!fs.existsSync(serviceAccountFile)) {
    try {
      const files = fs.readdirSync('.');
      const adminSdkFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      if (adminSdkFile) {
        serviceAccountFile = `./${adminSdkFile}`;
      }
    } catch (e) {
      console.warn('⚠️ เกิดข้อผิดพลาดขณะค้นหาไฟล์ในไดเรกทอรี:', e.message);
    }
  }
  
  if (!fs.existsSync(serviceAccountFile)) {
    console.error('❌ Error: ไม่พบไฟล์คีย์ Firebase (serviceAccountKey.json หรือไฟล์ firebase-adminsdk-*.json)');
    console.log('\nกรุณาดาวน์โหลดไฟล์คีย์จาก Firebase Console:');
    console.log('1. เข้าไปยัง Firebase Console -> Project Settings -> Service accounts');
    console.log('2. คลิกปุ่ม "Generate new private key" (สร้างคีย์ส่วนตัวใหม่)');
    console.log(`3. บันทึกไฟล์ไว้ในโฟลเดอร์นี้: ${path.resolve('.')}`);
    process.exit(1);
  }

  console.log(`🔑 ใช้ไฟล์คีย์: ${serviceAccountFile}`);
  const serviceAccount = require(serviceAccountFile);

  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    
    const db = getFirestore();
    console.log('⏳ กำลังดึงข้อมูลผู้สมัคร Staff จาก Firebase (staff_applicants)...');
    
    const snapshot = await db.collection('staff_applicants').get();
    
    if (snapshot.empty) {
      console.log('❌ ไม่พบข้อมูลผู้ลงทะเบียน Staff หรือคอลเลกชัน staff_applicants ว่างเปล่า');
      return;
    }

    const totalApplicants = snapshot.size;
    console.log(`✅ ดึงข้อมูลสำเร็จ! พบผู้สมัครทั้งหมด ${totalApplicants} คน\n`);

    const role1Count = {};
    const role2Count = {};
    const totalSelectionsCount = {}; // นับรวมการเลือกสะสม (Role 1 + Role 2)
    const uniqueApplicantsPerRole = {}; // นับผู้สมัครรายบุคคลที่สนใจฝ่ายนี้ (อย่างน้อย 1 อันดับ)

    snapshot.forEach(doc => {
      const data = doc.data();
      const role1 = (data.role1 || 'ไม่ได้ระบุ').trim();
      const role2 = (data.role2 || 'ไม่ได้ระบุ').trim();

      // นับอันดับ 1
      role1Count[role1] = (role1Count[role1] || 0) + 1;

      // นับอันดับ 2
      role2Count[role2] = (role2Count[role2] || 0) + 1;

      // นับรวมการเลือกสะสม
      totalSelectionsCount[role1] = (totalSelectionsCount[role1] || 0) + 1;
      totalSelectionsCount[role2] = (totalSelectionsCount[role2] || 0) + 1;

      // นับจำนวนคนที่เลือก (ไม่ซ้ำกันในแต่ละฝ่าย เช่น ถ้าเลือกฝ่าย A ทั้งอันดับ 1 และ 2 ก็นับคนสมัครแค่ 1)
      uniqueApplicantsPerRole[role1] = (uniqueApplicantsPerRole[role1] || 0) + 1;
      if (role2 !== role1) {
        uniqueApplicantsPerRole[role2] = (uniqueApplicantsPerRole[role2] || 0) + 1;
      }
    });

    // รวบรวมชื่อฝ่ายทั้งหมดที่ตรวจพบ
    const allRoles = Array.from(new Set([
      ...Object.keys(role1Count),
      ...Object.keys(role2Count)
    ])).sort();

    // สร้างข้อมูลตารางสรุปผล
    const reportData = allRoles.map(role => {
      const r1 = role1Count[role] || 0;
      const r2 = role2Count[role] || 0;
      return {
        'ฝ่าย (Role)': role,
        'เลือกอันดับ 1 (Role 1)': r1,
        'เลือกอันดับ 2 (Role 2)': r2,
        'จำนวนเลือกสะสม (Cumulative)': r1 + r2,
        'จำนวนคนสมัคร (Unique Applicants)': uniqueApplicantsPerRole[role] || 0
      };
    });

    console.log('📊 สรุปยอดผู้สมัครแยกตามฝ่าย (แสดงผลบนคอนโซล):');
    console.table(reportData);

    // เขียนไฟล์รายงานสรุปผลเป็น Markdown
    let reportText = `# รายงานสรุปยอดผู้สมัคร Staff แยกตามฝ่าย\n`;
    reportText += `สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}\n`;
    reportText += `จำนวนผู้สมัครทั้งหมดในระบบ: ${totalApplicants} คน\n\n`;
    
    reportText += `| ฝ่าย (Role) | เลือกอันดับ 1 (Role 1) | เลือกอันดับ 2 (Role 2) | เลือกสะสมทั้งหมด | จำนวนคนสมัครจริง (Unique) |\n`;
    reportText += `| :--- | :---: | :---: | :---: | :---: |\n`;
    
    let sumR1 = 0;
    let sumR2 = 0;
    let sumCum = 0;

    reportData.forEach(row => {
      const r1 = row['เลือกอันดับ 1 (Role 1)'];
      const r2 = row['เลือกอันดับ 2 (Role 2)'];
      const cum = row['จำนวนเลือกสะสม (Cumulative)'];
      const uniq = row['จำนวนคนสมัคร (Unique Applicants)'];
      
      sumR1 += r1;
      sumR2 += r2;
      sumCum += cum;

      reportText += `| ${row['ฝ่าย (Role)']} | ${r1} | ${r2} | ${cum} | ${uniq} |\n`;
    });

    reportText += `| **รวมทั้งหมด** | **${sumR1}** | **${sumR2}** | **${sumCum}** | **-** |\n\n`;
    reportText += `*หมายเหตุ:\n`;
    reportText += `1. **เลือกสะสมทั้งหมด**: ผลรวมการเลือกของอันดับ 1 และอันดับ 2 ของฝ่ายนั้น ๆ\n`;
    reportText += `2. **จำนวนคนสมัครจริง (Unique)**: นับจำนวนคนที่มีความสนใจในฝ่ายนั้น ๆ จริง (หากคนสมัครเลือกฝ่ายเดียวกันทั้งอันดับ 1 และ 2 จะนับเป็น 1 คน)*\n`;

    const reportFileName = './staff_roles_report.md';
    fs.writeFileSync(reportFileName, reportText, 'utf8');
    
    console.log(`\n💾 บันทึกรายงานสรุปผลลงไฟล์เรียบร้อยแล้ว: ${path.resolve(reportFileName)}`);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
  } finally {
    process.exit(0);
  }
}

run();
