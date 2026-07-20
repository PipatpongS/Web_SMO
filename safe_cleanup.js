const fs = require('fs');

// StaffRegContext.jsx changes
let ctxPath = 'apps/student-reg/src/contexts/StaffRegContext.jsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');

// Remove program, joinActivity, is_verified from allowedFields
ctx = ctx.replace(/'program',\s*/g, '');
ctx = ctx.replace(/'joinActivity',\s*/g, '');
ctx = ctx.replace(/is_verified: false,/g, '');

fs.writeFileSync(ctxPath, ctx, 'utf8');

// StaffRegister.jsx changes
let staffRegPath = 'apps/student-reg/src/pages/StaffRegister.jsx';
let staffReg = fs.readFileSync(staffRegPath, 'utf8');

// Use Staff specific time checks
staffReg = staffReg.replace(/isRegistrationOpen/g, 'isStaffRegistrationOpen');
staffReg = staffReg.replace(/isBeforeRegistration/g, 'isBeforeStaffRegistration');
staffReg = staffReg.replace(/isAfterRegistration/g, 'isAfterStaffRegistration');
staffReg = staffReg.replace(/isEditClosed/g, 'isStaffEditClosed');
staffReg = staffReg.replace(/EDIT_DEADLINE/g, 'STAFF_EDIT_DEADLINE');

// Remove program state & validation
staffReg = staffReg.replace(/program: '',\r?\n/g, '');
staffReg = staffReg.replace(/program: 'โครงการ \*',\r?\n/g, '');
staffReg = staffReg.replace(/program: 'Program \*',\r?\n/g, '');
staffReg = staffReg.replace(/'program',\s*/g, '');
staffReg = staffReg.replace(/if \(!formData\.program\) return false;\r?\n/g, '');

// Remove joinActivity state & validation
staffReg = staffReg.replace(/joinActivity: '',\r?\n/g, '');
staffReg = staffReg.replace(/'joinActivity',\s*/g, '');
staffReg = staffReg.replace(/if \(!formData\.joinActivity\) return false;\r?\n/g, '');

// Remove program from the UI blocks (Find the Program select box and remove it)
// It's safer to just let the JSX be or use a strict regex. Actually, the user said "มันไม่มีแต่แรกอยู่แล้วหนิของ Staff", so maybe program JSX is already removed in StaffRegister.jsx! Let's check.
// Same for joinActivity JSX.

// Remove is_verified from isFieldLocked
staffReg = staffReg.replace(/if \(regData\?\.is_verified\) \{[\s\S]*?const verifiedLockedFields.*?\}[\s\S]*?\}/, '');

fs.writeFileSync(staffRegPath, staffReg, 'utf8');

console.log("Safe cleanup applied.");
