const fs = require('fs');

const generateCodesCode = `
    const studentId = data.studentId || '';
    const qr_code = \`\${userId}:\${studentId}\`;
    
    // Generate 3-char short_code securely using SHA-256
    const msgBuffer = new TextEncoder().encode(qr_code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let short_code = '';
    for(let i=0; i<3; i++) {
      short_code += chars[hashArray[i] % chars.length];
    }
`;

const injectGenerateCodes = (content) => {
  // Add to registerUser
  let newContent = content.replace(
    /const registrationPayload = {/g,
    generateCodesCode + '\n    const registrationPayload = {\n      qr_code,\n      short_code,'
  );

  // Add to updateUser
  newContent = newContent.replace(
    /const updatePayload = {/g,
    generateCodesCode.replace('const studentId = data.studentId || \'\';', 'const studentId = data.studentId !== undefined ? data.studentId : (regData.studentId || \'\');') + '\n    const updatePayload = {\n      qr_code,\n      short_code,'
  );
  
  return newContent;
};

let regContent = fs.readFileSync('apps/student-reg/src/contexts/RegContext.jsx', 'utf8');
fs.writeFileSync('apps/student-reg/src/contexts/RegContext.jsx', injectGenerateCodes(regContent), 'utf8');

let staffContent = fs.readFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', 'utf8');
fs.writeFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', injectGenerateCodes(staffContent), 'utf8');

console.log('Fields added to both contexts');
