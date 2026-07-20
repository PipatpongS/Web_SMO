const fs = require('fs');

let content = fs.readFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', 'utf8');

const targetRegex = /    \/\/ Check local edit count limit just to be safe\r?\n\s*\}/;

const replacement = `    // Check local edit count limit just to be safe
    if (regData.editCount >= 2) {
      return { success: false, error: "You have reached the maximum number of edits allowed." };
    }

    // Enforce locks for verified users
    if (regData.is_verified === true) {
      let lockedFields = ['nationality', 'titlePrefix', 'firstName', 'middleName', 'lastName', 'studentId', 'program', 'department'];
      
      for (const field of lockedFields) {
        if (data[field] !== undefined && data[field] !== regData[field]) {
          return { success: false, error: "ไม่สามารถแก้ไขข้อมูลดังกล่าวได้ หากต้องการแก้ไขข้อมูลดังกล่าว โปรดติดต่อผ่านทีมงาน" };
        }
      }
    }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', content, 'utf8');
console.log('Repaired StaffRegContext syntax error');
