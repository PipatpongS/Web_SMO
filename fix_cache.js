const fs = require('fs');

const fixCacheUpdate = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix registerUser cache update
  content = content.replace(/await batch\.commit\(\);\r?\n\s*\}\r?\n\r?\n\s*localStorage\.removeItem\('registerFormData'\);\r?\n\s*return \{ success: true \};/, 
    `await batch.commit();
      }

      localStorage.setItem(\`staff_reg_\${userId}\`, JSON.stringify(registrationPayload));
      localStorage.removeItem(\`not_staff_reg_\${userId}\`);
      setRegData(registrationPayload);
      setIsRegistered(true);

      localStorage.removeItem('registerFormData');
      return { success: true };`);

  fs.writeFileSync(filePath, content, 'utf8');
};

fixCacheUpdate('apps/student-reg/src/contexts/StaffRegContext.jsx');
console.log("Fixed cache update");
