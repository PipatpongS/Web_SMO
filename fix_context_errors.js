const fs = require('fs');

const fixContext = (filePath, collectionName) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // We will do a full replace of the registerUser function body
  const regUserRegex = /const registerUser = async \(data\) => \{([\s\S]*?)\};\r?\n\r?\n  const updateUser/g;
  
  content = content.replace(regUserRegex, (match, body) => {
    return `const registerUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    const userId = userProfile.userId;
    const studentId = data.studentId || '';
    const qr_code = \`\${userId}:\${studentId}\`;

    try {
      const short_code = await generateUniqueShortCode(db, qr_code);
      delete data.studentIdStatus;
      
      const registrationPayload = {
        qr_code,
        short_code,
        ...data,
        line_uid: userId,
        line_displayName: userProfile.displayName || '',
        line_pictureUrl: userProfile.pictureUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        is_verified: false,
        editCount: 0
      };

      if (db) {
        const batch = writeBatch(db);
        batch.set(doc(db, "${collectionName}", userId), registrationPayload);
        batch.set(doc(db, "used_short_codes", short_code), { uid: userId, timestamp: new Date().toISOString() });
        await batch.commit();
      }

      localStorage.removeItem('registerFormData');
      return { success: true };
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === 'permission-denied') {
        return { success: false, error: 'permission_denied', errorMsg: err.message };
      }
      return { success: false, error: 'register_failed', errorMsg: err.message };
    }
  };

  const updateUser`;
  });

  // Do the same for updateUser body
  const updateUserRegex = /const updateUser = async \(data\) => \{([\s\S]*?)\};\r?\n\r?\n  const value = \{/g;
  
  content = content.replace(updateUserRegex, (match, body) => {
    // Extract the allowedFields processing block to keep it
    const allowedFieldsMatch = body.match(/(const allowedFields = \[[\s\S]*?\];\s*const sanitizedData = \{\};\s*allowedFields\.forEach[\s\S]*?\}\);)/);
    const allowedFieldsBlock = allowedFieldsMatch ? allowedFieldsMatch[1] : '';

    return `const updateUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    if (!isRegistered || !regData) return { success: false, error: "No existing registration found" };

    if (regData.editCount >= 2) {
      return { success: false, error: "You have reached the maximum number of edits allowed." };
    }

    if (regData.is_verified === true) {
      let lockedFields = ['nationality', 'titlePrefix', 'firstName', 'middleName', 'lastName', 'studentId', 'program', 'department'];
      for (const field of lockedFields) {
        if (data[field] !== undefined && data[field] !== regData[field]) {
          return { success: false, error: "ไม่สามารถแก้ไขข้อมูลดังกล่าวได้ หากต้องการแก้ไขข้อมูลดังกล่าว โปรดติดต่อผ่านทีมงาน" };
        }
      }
    }

    const userId = userProfile.userId;
    const newEditCount = (regData.editCount || 0) + 1;

    ${allowedFieldsBlock}

    const oldStudentId = regData.studentId || '';
    const studentId = data.studentId !== undefined ? data.studentId : oldStudentId;
    const qr_code = \`\${userId}:\${studentId}\`;

    try {
      let short_code = regData.short_code;
      let generateNewCode = !short_code || regData.qr_code !== qr_code;
      
      if (generateNewCode) {
        short_code = await generateUniqueShortCode(db, qr_code);
      }

      const updatePayload = {
        qr_code,
        short_code,
        ...sanitizedData,
        line_displayName: userProfile.displayName || '',
        line_pictureUrl: userProfile.pictureUrl || '',
        updatedAt: new Date().toISOString(),
        editCount: newEditCount
      };

      if (db) {
        if (generateNewCode) {
          const batch = writeBatch(db);
          batch.update(doc(db, "${collectionName}", userId), updatePayload);
          batch.set(doc(db, "used_short_codes", short_code), { uid: userId, timestamp: new Date().toISOString() });
          await batch.commit();
        } else {
          await updateDoc(doc(db, "${collectionName}", userId), updatePayload);
        }
      }

      return { success: true };
    } catch (err) {
      console.error("Update error:", err);
      if (err.code === 'permission-denied') {
        return { success: false, error: 'permission_denied', errorMsg: err.message };
      }
      return { success: false, error: 'update_failed', errorMsg: err.message };
    }
  };

  const value = {`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
};

fixContext('apps/student-reg/src/contexts/StaffRegContext.jsx', 'staff_applicants');

let rulesContent = fs.readFileSync('apps/student-reg/firestore.rules', 'utf8');
rulesContent = rulesContent.replace(/\\n/g, '\n');
fs.writeFileSync('apps/student-reg/firestore.rules', rulesContent, 'utf8');

console.log("Fixed context and rules");
