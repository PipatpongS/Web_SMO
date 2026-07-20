const fs = require('fs');

// StaffRegContext.jsx changes
let ctxPath = 'apps/student-reg/src/contexts/StaffRegContext.jsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');

ctx = ctx.replace(/'program',\s*/g, '');
ctx = ctx.replace(/'joinActivity',\s*/g, '');
ctx = ctx.replace(/is_verified: false,/g, '');
ctx = ctx.replace(/note: 'รอบพิเศษ'/g, 'note: null');
ctx = ctx.replace(/\/\/ Enforce locks for verified users[\s\S]*?if \(regData\.is_verified === true\) \{[\s\S]*?\}\r?\n\s*\}/g, '');

fs.writeFileSync(ctxPath, ctx, 'utf8');

// StaffRegister.jsx changes
let staffRegPath = 'apps/student-reg/src/pages/StaffRegister.jsx';
let staffReg = fs.readFileSync(staffRegPath, 'utf8');

staffReg = staffReg.replace(/isRegistrationOpen/g, 'isStaffRegistrationOpen');
staffReg = staffReg.replace(/isBeforeRegistration/g, 'isBeforeStaffRegistration');
staffReg = staffReg.replace(/isAfterRegistration/g, 'isAfterStaffRegistration');
staffReg = staffReg.replace(/isEditClosed/g, 'isStaffEditClosed');
staffReg = staffReg.replace(/EDIT_DEADLINE/g, 'STAFF_EDIT_DEADLINE');

staffReg = staffReg.replace(/program: '',\r?\n/g, '');
staffReg = staffReg.replace(/program: 'โครงการ \*',\r?\n/g, '');
staffReg = staffReg.replace(/program: 'Program \*',\r?\n/g, '');
staffReg = staffReg.replace(/'program',\s*/g, '');
staffReg = staffReg.replace(/if \(!formData\.program\) return false;\r?\n/g, '');

staffReg = staffReg.replace(/joinActivity: '',\r?\n/g, '');
staffReg = staffReg.replace(/'joinActivity',\s*/g, '');
staffReg = staffReg.replace(/if \(!formData\.joinActivity\) return false;\r?\n/g, '');

const newIsFieldLocked = "const isFieldLocked = (fieldName) => {\n" +
"    if (!isEditMode) return false;\n" +
"    if (['shirtSize'].includes(fieldName)) {\n" +
"      return true;\n" +
"    }\n" +
"    return false;\n" +
"  };";
staffReg = staffReg.replace(/const isFieldLocked = \(fieldName\) => \{[\s\S]*?return false;\r?\n\s*\};/, newIsFieldLocked);
staffReg = staffReg.replace(/useEffect\(\(\) => \{\s*if \(regData\?\.is_verified\).*?\{[\s\S]*?\}\s*\}, \[regData\]\);/, '');

fs.writeFileSync(staffRegPath, staffReg, 'utf8');

// timeConfig.js changes
let timeConfigStr = "// ตั้งค่าเวลาเปิด-ปิดรับสมัคร (สามารถแก้ได้ที่นี่)\n" +
"// รูปแบบเวลา: YYYY-MM-DDTHH:mm:ss+07:00 (เวลาไทย)\n\n" +
"export const REGISTRATION_START_DATE = import.meta.env.VITE_REGISTRATION_START_DATE || '2026-06-15T00:00:00+07:00';\n" +
"export const REGISTRATION_END_DATE = import.meta.env.VITE_REGISTRATION_END_DATE || '2026-07-01T23:59:59+07:00';\n" +
"export const EDIT_DEADLINE = import.meta.env.VITE_EDIT_DEADLINE || '2026-07-01T23:59:59+07:00';\n\n" +
"export const STAFF_REGISTRATION_START_DATE = import.meta.env.VITE_STAFF_REGISTRATION_START_DATE || '2026-07-10T00:00:00+07:00';\n" +
"export const STAFF_REGISTRATION_END_DATE = import.meta.env.VITE_STAFF_REGISTRATION_END_DATE || '2026-07-22T23:59:59+07:00';\n" +
"export const STAFF_EDIT_DEADLINE = import.meta.env.VITE_STAFF_EDIT_DEADLINE || '2026-07-24T23:59:59+07:00';\n\n" +
"export const isRegistrationOpen = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const start = new Date(REGISTRATION_START_DATE).getTime();\n" +
"  const end = new Date(REGISTRATION_END_DATE).getTime();\n" +
"  return now >= start && now <= end;\n" +
"};\n\n" +
"export const isStaffRegistrationOpen = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const start = new Date(STAFF_REGISTRATION_START_DATE).getTime();\n" +
"  const end = new Date(STAFF_REGISTRATION_END_DATE).getTime();\n" +
"  return now >= start && now <= end;\n" +
"};\n\n" +
"export const isBeforeRegistration = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const start = new Date(REGISTRATION_START_DATE).getTime();\n" +
"  return now < start;\n" +
"};\n\n" +
"export const isBeforeStaffRegistration = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const start = new Date(STAFF_REGISTRATION_START_DATE).getTime();\n" +
"  return now < start;\n" +
"};\n\n" +
"export const isAfterRegistration = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const end = new Date(REGISTRATION_END_DATE).getTime();\n" +
"  return now > end;\n" +
"};\n\n" +
"export const isAfterStaffRegistration = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const end = new Date(STAFF_REGISTRATION_END_DATE).getTime();\n" +
"  return now > end;\n" +
"};\n\n" +
"export const isEditClosed = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const end = new Date(EDIT_DEADLINE).getTime();\n" +
"  return now > end;\n" +
"};\n\n" +
"export const isStaffEditClosed = () => {\n" +
"  const now = new Date().getTime();\n" +
"  const end = new Date(STAFF_EDIT_DEADLINE).getTime();\n" +
"  return now > end;\n" +
"};\n";
fs.writeFileSync('apps/student-reg/src/config/timeConfig.js', timeConfigStr, 'utf8');

// StaffHome.jsx
let staffHomePath = 'apps/student-reg/src/pages/StaffHome.jsx';
let staffHome = fs.readFileSync(staffHomePath, 'utf8');
staffHome = staffHome.replace(/isRegistrationOpen/g, 'isStaffRegistrationOpen');
staffHome = staffHome.replace(/isBeforeRegistration/g, 'isBeforeStaffRegistration');
staffHome = staffHome.replace(/isAfterRegistration/g, 'isAfterStaffRegistration');
fs.writeFileSync(staffHomePath, staffHome, 'utf8');

// StaffProfile.jsx
let staffProfilePath = 'apps/student-reg/src/pages/StaffProfile.jsx';
let staffProfile = fs.readFileSync(staffProfilePath, 'utf8');
staffProfile = staffProfile.replace(/isEditClosed/g, 'isStaffEditClosed');
staffProfile = staffProfile.replace(/EDIT_DEADLINE/g, 'STAFF_EDIT_DEADLINE');
fs.writeFileSync(staffProfilePath, staffProfile, 'utf8');

// firestore.rules
let rulesPath = 'apps/student-reg/firestore.rules';
let rules = fs.readFileSync(rulesPath, 'utf8');

const newStaffRules = "    // ✅ กฎสำหรับ Staff (Collection: staff_applicants)\n" +
"    match /staff_applicants/{userId} {\n" +
"      allow get: if true;\n" +
"      allow list: if false;\n" +
"      \n" +
"      allow create: if isOwner(userId)\n" +
"                    && request.resource.data.line_uid == userId\n" +
"                    && request.resource.data.editCount == 0\n" +
"                    && request.time.toMillis() >= 1783616400000 // 10 Jul 2026 00:00:00 GMT+7\n" +
"                    && request.time.toMillis() <= 1784739599000; // 22 Jul 2026 23:59:59 GMT+7\n" +
"      \n" +
"      allow update: if isOwner(userId)\n" +
"                    && resource.data.editCount < 2\n" +
"                    && request.resource.data.editCount == resource.data.editCount + 1\n" +
"                    && request.time.toMillis() <= 1784912399000; // 24 Jul 2026 23:59:59 GMT+7\n" +
"                    \n" +
"      allow delete: if false;\n" +
"    }";

rules = rules.replace(/\/\/\s*✅\s*กฎสำหรับ Staff \(Collection: staff_applicants\)[\s\S]*?allow delete: if false;\r?\n\s*\}/g, newStaffRules.trim());

fs.writeFileSync(rulesPath, rules, 'utf8');

console.log("Safe cleanup 3 applied.");
