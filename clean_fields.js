const fs = require('fs');

// 1. Clean StaffRegContext.jsx
let ctxPath = 'apps/student-reg/src/contexts/StaffRegContext.jsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');

// Replace allowedFields
ctx = ctx.replace(/'studentIdStatus', /g, '');
ctx = ctx.replace(/'pdpaConsent', /g, '');
// Add year and nickname
ctx = ctx.replace(/'joinActivity',/, "'joinActivity', 'year', 'nickname',");

// In registerUser, we should also delete studentIdStatus and pdpaConsent from data before spreading
const registerUserMatch = ctx.match(/(const registrationPayload = \{\s*qr_code,\s*short_code,\s*\.\.\.data,)/);
if (registerUserMatch) {
  ctx = ctx.replace(/(const registrationPayload = \{\s*qr_code,\s*short_code,\s*\.\.\.data,)/, 
    `delete data.studentIdStatus;
    delete data.pdpaConsent;
    $1`);
}

fs.writeFileSync(ctxPath, ctx, 'utf8');


// 2. Clean StaffRegister.jsx
let regPath = 'apps/student-reg/src/pages/StaffRegister.jsx';
let reg = fs.readFileSync(regPath, 'utf8');

// Remove studentIdStatus from checkKeys
reg = reg.replace(/'studentIdStatus', /g, '');

// Remove studentIdStatus from formData initialization (approx lines 236-240)
reg = reg.replace(/\s*studentIdStatus: '.*?',\r?\n/, '\n');
reg = reg.replace(/\s*studentIdStatus: '',\r?\n/, '\n');

// In processSubmit, we should delete pdpaConsent before sending
const processSubmitMatch = reg.match(/const trimmedData = \{[\s\S]*?\};\r?\n/);
if (processSubmitMatch) {
  reg = reg.replace(/(const trimmedData = \{[\s\S]*?\};\r?\n)/, 
    `$1    delete trimmedData.studentIdStatus;\n    delete trimmedData.pdpaConsent;\n`);
}

fs.writeFileSync(regPath, reg, 'utf8');
console.log("Cleanup done!");
