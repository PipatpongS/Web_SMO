const fs = require('fs');

let ctxPath = 'apps/student-reg/src/contexts/StaffRegContext.jsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');

// Add pdpaConsent to allowedFields
ctx = ctx.replace(/'joinActivity', 'year', 'nickname',/g, "'joinActivity', 'year', 'nickname', 'pdpaConsent',");

// Remove delete data.pdpaConsent; from registerUser
ctx = ctx.replace(/\s*delete data\.pdpaConsent;\r?\n/g, '\n');

fs.writeFileSync(ctxPath, ctx, 'utf8');


let regPath = 'apps/student-reg/src/pages/StaffRegister.jsx';
let reg = fs.readFileSync(regPath, 'utf8');

// Remove delete trimmedData.pdpaConsent; from processSubmit
reg = reg.replace(/\s*delete trimmedData\.pdpaConsent;\r?\n/g, '\n');

fs.writeFileSync(regPath, reg, 'utf8');
console.log("Restored pdpaConsent");
