const fs = require('fs');

let content = fs.readFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', 'utf8');

const targetRegex = /if \(!isRegistered \|\| !regData\) return \{ success: false, error: "No existing registration found" \};\s*\}\s*\/\/\s*Enforce lock for shirt size for EVERYONE/;

const replacement = `if (!isRegistered || !regData) return { success: false, error: "No existing registration found" };

    if (regData.editCount >= 2) {
      return { success: false, error: "You have reached the maximum number of edits allowed." };
    }

    if (regData.is_verified === true) {
      let lockedFields = ['nationality', 'titlePrefix', 'firstName', 'middleName', 'lastName', 'studentId', 'program', 'department'];
      for (const field of lockedFields) {
        if (data[field] !== undefined && data[field] !== regData[field]) {
          return { success: false, error: "ไม่สามารถแก้ไขข้อมูลดังกล่าวได้ หากต้องการแก้ไขข้อมูลดังกล่าว โปรดติดต่อผ่านทีมงาน (LINE OA: @122ddost)" };
        }
      }
    }

    // Enforce lock for shirt size for EVERYONE`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', content, 'utf8');
  console.log('Repaired StaffRegContext');
} else {
  console.log('Target not found, maybe already fixed or different format');
}
