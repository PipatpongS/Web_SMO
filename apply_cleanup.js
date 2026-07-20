const fs = require('fs');

// 1. timeConfig.js
let timeConfigStr = `// ตั้งค่าเวลาเปิด-ปิดรับสมัคร (สามารถแก้ได้ที่นี่)
// รูปแบบเวลา: YYYY-MM-DDTHH:mm:ss+07:00 (เวลาไทย)

export const REGISTRATION_START_DATE = import.meta.env.VITE_REGISTRATION_START_DATE || '2026-06-15T00:00:00+07:00';
export const REGISTRATION_END_DATE = import.meta.env.VITE_REGISTRATION_END_DATE || '2026-07-01T23:59:59+07:00';
export const EDIT_DEADLINE = import.meta.env.VITE_EDIT_DEADLINE || '2026-07-01T23:59:59+07:00';

export const STAFF_REGISTRATION_START_DATE = import.meta.env.VITE_STAFF_REGISTRATION_START_DATE || '2026-07-10T00:00:00+07:00';
export const STAFF_REGISTRATION_END_DATE = import.meta.env.VITE_STAFF_REGISTRATION_END_DATE || '2026-07-22T23:59:59+07:00';
export const STAFF_EDIT_DEADLINE = import.meta.env.VITE_STAFF_EDIT_DEADLINE || '2026-07-24T23:59:59+07:00';

// ฟังก์ชันสำหรับเช็คว่าตอนนี้เปิดรับสมัครหรือยัง (ผู้เข้าร่วม)
export const isRegistrationOpen = () => {
  const now = new Date().getTime();
  const start = new Date(REGISTRATION_START_DATE).getTime();
  const end = new Date(REGISTRATION_END_DATE).getTime();
  return now >= start && now <= end;
};

// ฟังก์ชันสำหรับเช็คว่าตอนนี้เปิดรับสมัครหรือยัง (Staff)
export const isStaffRegistrationOpen = () => {
  const now = new Date().getTime();
  const start = new Date(STAFF_REGISTRATION_START_DATE).getTime();
  const end = new Date(STAFF_REGISTRATION_END_DATE).getTime();
  return now >= start && now <= end;
};

export const isBeforeRegistration = () => {
  const now = new Date().getTime();
  const start = new Date(REGISTRATION_START_DATE).getTime();
  return now < start;
};

export const isBeforeStaffRegistration = () => {
  const now = new Date().getTime();
  const start = new Date(STAFF_REGISTRATION_START_DATE).getTime();
  return now < start;
};

export const isAfterRegistration = () => {
  const now = new Date().getTime();
  const end = new Date(REGISTRATION_END_DATE).getTime();
  return now > end;
};

export const isAfterStaffRegistration = () => {
  const now = new Date().getTime();
  const end = new Date(STAFF_REGISTRATION_END_DATE).getTime();
  return now > end;
};

export const isEditClosed = () => {
  const now = new Date().getTime();
  const end = new Date(EDIT_DEADLINE).getTime();
  return now > end;
};

export const isStaffEditClosed = () => {
  const now = new Date().getTime();
  const end = new Date(STAFF_EDIT_DEADLINE).getTime();
  return now > end;
};
`;
fs.writeFileSync('apps/student-reg/src/config/timeConfig.js', timeConfigStr, 'utf8');


// 2. StaffHome.jsx
let staffHomePath = 'apps/student-reg/src/pages/StaffHome.jsx';
let staffHome = fs.readFileSync(staffHomePath, 'utf8');
staffHome = staffHome.replace(/isRegistrationOpen/g, 'isStaffRegistrationOpen');
staffHome = staffHome.replace(/isBeforeRegistration/g, 'isBeforeStaffRegistration');
staffHome = staffHome.replace(/isAfterRegistration/g, 'isAfterStaffRegistration');
fs.writeFileSync(staffHomePath, staffHome, 'utf8');

// 3. StaffRegister.jsx
let staffRegPath = 'apps/student-reg/src/pages/StaffRegister.jsx';
let staffReg = fs.readFileSync(staffRegPath, 'utf8');
staffReg = staffReg.replace(/isRegistrationOpen/g, 'isStaffRegistrationOpen');
staffReg = staffReg.replace(/isBeforeRegistration/g, 'isBeforeStaffRegistration');
staffReg = staffReg.replace(/isAfterRegistration/g, 'isAfterStaffRegistration');
staffReg = staffReg.replace(/isEditClosed/g, 'isStaffEditClosed');
staffReg = staffReg.replace(/EDIT_DEADLINE/g, 'STAFF_EDIT_DEADLINE');

// Remove is_verified checks in StaffRegister
staffReg = staffReg.replace(/if \(regData\?\.is_verified\).*?\{[\s\S]*?\}/g, '');
staffReg = staffReg.replace(/showLockedModal/g, 'showLockedModal_REMOVED'); // Avoid errors if we miss one
fs.writeFileSync(staffRegPath, staffReg, 'utf8');

// 4. StaffProfile.jsx
let staffProfilePath = 'apps/student-reg/src/pages/StaffProfile.jsx';
let staffProfile = fs.readFileSync(staffProfilePath, 'utf8');
staffProfile = staffProfile.replace(/isEditClosed/g, 'isStaffEditClosed');
staffProfile = staffProfile.replace(/EDIT_DEADLINE/g, 'STAFF_EDIT_DEADLINE');
fs.writeFileSync(staffProfilePath, staffProfile, 'utf8');

// 5. StaffRegContext.jsx
let ctxPath = 'apps/student-reg/src/contexts/StaffRegContext.jsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');

// Remove program, joinActivity, is_verified
ctx = ctx.replace(/'program',\s*/g, '');
ctx = ctx.replace(/'joinActivity',\s*/g, '');

// Set note: null, remove is_verified from payload
ctx = ctx.replace(/note: 'รอบพิเศษ'/g, 'note: null');
ctx = ctx.replace(/is_verified: false,/g, '');

// Remove is_verified check in updateUser
ctx = ctx.replace(/\/\/ Enforce locks for verified users[\s\S]*?if \(regData\.is_verified === true\) \{[\s\S]*?\}\r?\n\s*\}/g, '');

fs.writeFileSync(ctxPath, ctx, 'utf8');

// 6. firestore.rules
let rulesPath = 'apps/student-reg/firestore.rules';
let rules = fs.readFileSync(rulesPath, 'utf8');

const newStaffRules = `
    // ✅ กฎสำหรับ Staff (Collection: staff_applicants)
    match /staff_applicants/{userId} {
      allow get: if true;
      allow list: if false;
      
      allow create: if isOwner(userId)
                    && request.resource.data.line_uid == userId
                    && request.resource.data.editCount == 0
                    && request.time.toMillis() >= 1783616400000 // 10 Jul 2026 00:00:00 GMT+7
                    && request.time.toMillis() <= 1784739599000; // 22 Jul 2026 23:59:59 GMT+7
      
      allow update: if isOwner(userId)
                    && resource.data.editCount < 2
                    && request.resource.data.editCount == resource.data.editCount + 1
                    && request.time.toMillis() <= 1784912399000; // 24 Jul 2026 23:59:59 GMT+7
                    
      allow delete: if false;
    }`;

rules = rules.replace(/\/\/\s*✅\s*กฎสำหรับ Staff \(Collection: staff_applicants\)[\s\S]*?allow delete: if false;\r?\n\s*\}/g, newStaffRules.trim());

fs.writeFileSync(rulesPath, rules, 'utf8');

console.log("Cleanup and rules applied");
