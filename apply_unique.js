const fs = require('fs');

const applyChanges = (filePath, collectionName) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add writeBatch to import
  content = content.replace(/import \{ doc, getDoc, setDoc, updateDoc, onSnapshot \} from 'firebase\/firestore';/, 
    "import { doc, getDoc, setDoc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';");
  
  if (!content.includes('writeBatch')) {
    content = content.replace(/import \{.*?\} from 'firebase\/firestore';/, (match) => {
      return match.replace('}', ', writeBatch }');
    });
  }

  // 2. Add generateUniqueShortCode function
  const funcStr = `
  const generateUniqueShortCode = async (db, baseQrCode) => {
    let attempt = 0;
    while (true) {
      const msgBuffer = new TextEncoder().encode(baseQrCode + (attempt > 0 ? \`_\${attempt}\` : ''));
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let code = '';
      code += letters[hashArray[0] % 26];
      code += letters[hashArray[1] % 26];
      code += numbers[hashArray[2] % 10];
      code += numbers[hashArray[3] % 10];

      const docRef = doc(db, 'used_short_codes', code);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return code;
      }
      attempt++;
    }
  };
`;

  // Find where to insert it. Just before "const registerUser = async"
  if (!content.includes('generateUniqueShortCode')) {
    content = content.replace(/(\s*)(const registerUser = async)/, `$1${funcStr}$1$2`);
  }

  // 3. Update registerUser
  // Remove old hash block
  const oldHashRegex = /\s*\/\/\s*Generate 3-char short_code securely using SHA-256[\s\S]*?(?=\s*const registrationPayload)/g;
  content = content.replace(oldHashRegex, '\n    const short_code = await generateUniqueShortCode(db, qr_code);\n\n');
  
  // Replace setDoc with batch
  const setDocRegex = new RegExp(`await setDoc\\(doc\\(db, "${collectionName}", userId\\), registrationPayload\\);`);
  const batchSave = `const batch = writeBatch(db);
      batch.set(doc(db, "${collectionName}", userId), registrationPayload);
      batch.set(doc(db, "used_short_codes", short_code), { uid: userId, timestamp: new Date().toISOString() });
      await batch.commit();`;
  content = content.replace(setDocRegex, batchSave);

  // 4. Update updateUser
  // Remove old hash block
  const oldUpdateHashRegex = /\s*\/\/\s*Generate 3-char short_code securely using SHA-256[\s\S]*?(?=\s*const updatePayload)/g;
  const newUpdateHash = `
    let short_code = regData.short_code;
    if (!short_code || regData.qr_code !== qr_code) {
      short_code = await generateUniqueShortCode(db, qr_code);
    }
`;
  content = content.replace(oldUpdateHashRegex, newUpdateHash);

  // Replace updateDoc with batch logic
  const updateDocRegex = new RegExp(`await updateDoc\\(doc\\(db, "${collectionName}", userId\\), updatePayload\\);`);
  const batchUpdate = `if (!regData.short_code || regData.qr_code !== qr_code) {
      const batch = writeBatch(db);
      batch.update(doc(db, "${collectionName}", userId), updatePayload);
      batch.set(doc(db, "used_short_codes", short_code), { uid: userId, timestamp: new Date().toISOString() });
      await batch.commit();
    } else {
      await updateDoc(doc(db, "${collectionName}", userId), updatePayload);
    }`;
  content = content.replace(updateDocRegex, batchUpdate);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
};

applyChanges('apps/student-reg/src/contexts/RegContext.jsx', 'users');
applyChanges('apps/student-reg/src/contexts/StaffRegContext.jsx', 'staff_applicants');

