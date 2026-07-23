const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/student-reg/src/pages/StaffRegister.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update initial formData state to include new fields
content = content.replace(
  /titlePrefix: '',/g,
  "titlePrefix: '',\n      nickname: '',\n      year: '',\n      lineId: '',\n      role1: '',\n      role2: '',"
);

// 2. Add validation in handleChange for nickname and lineId
// For Line ID: English and Numbers only, no spaces.
// For Nickname: Any text but no numbers or special characters.
const newHandleChangeLogic = `
    // Validate Line ID (No space, English/Numbers only)
    if (name === 'lineId' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^a-zA-Z0-9]/g, '');
    }

    // Validate Nickname (No numbers, No special characters)
    if (name === 'nickname' && typeof newValue === 'string') {
      newValue = newValue.replace(/[0-9!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/g, '');
    }
`;
content = content.replace(
  /let newValue = type === 'checkbox' \? checked : value;/g,
  `let newValue = type === 'checkbox' ? checked : value;\n${newHandleChangeLogic}`
);

// 3. Change Student ID logic
// Find: const requiredPrefix = formData.nationality === 'ต่างชาติ' ? '69' : '6907050';
// Replace: const requiredPrefix = '6';
content = content.replace(/const requiredPrefix = formData\.nationality === 'ต่างชาติ' \? '69' : '6907050';/g, "const requiredPrefix = '6';");
content = content.replace(/!formData\.studentId\.startsWith\(requiredPrefix\)/g, "!formData.studentId.startsWith('6')");
content = content.replace(/formData\.studentId\.length !== 11/g, "formData.studentId.length !== 11");

// 4. Update the save logic in processSubmit to use a different collection if possible,
// but since we are using useRegistration(), we might need to bypass it or send a flag.
// A simpler way is to just write the data to firestore directly here and skip registerUser for Staff.
// Let's add direct firestore import at the top
content = content.replace(
  /import \{ useRegistration \} from '\.\.\/contexts\/RegContext';/,
  `import { useRegistration } from '../contexts/RegContext';\nimport { collection, doc, setDoc } from 'firebase/firestore';\nimport { db } from '../config/firebase';`
);

// Replace the submit call
const submitReplacement = `
    const currentMode = isEditMode ? 'edit' : 'register';
    
    // Custom Staff Save Logic
    let result = { success: false };
    try {
      const docRef = doc(collection(db, 'staff_applicants'), trimmedData.studentId || trimmedData.email);
      await setDoc(docRef, trimmedData);
      result = { success: true };
    } catch (err) {
      result = { success: false, error: err.message };
    }
`;
content = content.replace(
  /const currentMode = isEditMode \? 'edit' : 'register';[\s\S]*?const result = isEditMode \? await updateUser\(trimmedData\) : await registerUser\(trimmedData\);/m,
  submitReplacement
);

// 5. UI Updates - Add Nickname, LineID, Year to Step 1
const nicknameUI = `
                    <div>
                      <label className={labelClass}>{lang === 'TH' ? 'ชื่อเล่น *' : 'Nickname *'}</label>
                      <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className={inputClass} placeholder={lang === 'TH' ? 'ชื่อเล่น' : 'Nickname'} />
                    </div>
`;
content = content.replace(/(<label className=\{labelClass\}>\{t.firstName\}<\/label>)/, `${nicknameUI}\n                      $1`);

const lineIdUI = `
                  <div>
                    <label className={labelClass}>Line ID *</label>
                    <input type="text" name="lineId" value={formData.lineId} onChange={handleChange} className={inputClass} placeholder="Line ID" />
                  </div>
`;
content = content.replace(/(<div>\s*<label className=\{labelClass\}>\{t.phone\}<\/label>)/, `${lineIdUI}\n                  $1`);

const yearUI = `
                  <div>
                    <label className={labelClass}>{lang === 'TH' ? 'ชั้นปี *' : 'Year *'}</label>
                    <select name="year" value={formData.year} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกชั้นปี --</option>
                      <option value="1">ปี 1</option>
                      <option value="2">ปี 2</option>
                      <option value="3">ปี 3</option>
                      <option value="4">ปี 4</option>
                    </select>
                  </div>
`;
content = content.replace(/(<div>\s*<label className=\{labelClass\}>\{t.studentIdStatus\}<\/label>)/, `${yearUI}\n                  $1`);

// 6. Step 3 - Add Roles
const rolesUI = `
              <div className="bg-white/60 p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">ตำแหน่งที่เปิดรับสมัคร</h4>
                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                  <li><strong>พยาบาล:</strong> แจกแอมโมเนียและส่งต่อ EMS</li>
                  <li><strong>กิจกรรม:</strong> จัดกิจกรรม, นำวิ่งรับเกียร์</li>
                  <li><strong>สถานที่/สวัสดิการ:</strong> จัดสถานที่, แจกน้ำ/ขนม</li>
                  <li><strong>ประชาสัมพันธ์:</strong> ถ่ายรูปทำคอนเทนต์</li>
                </ul>
                
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>ตำแหน่งที่ต้องการสมัคร (อันดับ 1) *</label>
                    <select name="role1" value={formData.role1} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกตำแหน่งอันดับ 1 --</option>
                      <option value="พยาบาล">พยาบาล</option>
                      <option value="กิจกรรม">กิจกรรม</option>
                      <option value="สถานที่และสวัสดิการ">สถานที่และสวัสดิการ</option>
                      <option value="ประชาสัมพันธ์">ประชาสัมพันธ์</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>ตำแหน่งที่ต้องการสมัคร (อันดับ 2)</label>
                    <select name="role2" value={formData.role2} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกตำแหน่งอันดับ 2 (ถ้ามี) --</option>
                      <option value="พยาบาล">พยาบาล</option>
                      <option value="กิจกรรม">กิจกรรม</option>
                      <option value="สถานที่และสวัสดิการ">สถานที่และสวัสดิการ</option>
                      <option value="ประชาสัมพันธ์">ประชาสัมพันธ์</option>
                    </select>
                  </div>
                </div>
              </div>
`;

// Replace join activity in Step 3 with roles
content = content.replace(
  /<div className="border-t border-gray-100 pt-6">\s*<label className=\{labelClass\}>\{t.join\}<\/label>[\s\S]*?\{formData\.joinActivity === 'เข้าร่วม' && \(/m,
  `${rolesUI}\n\n              <div className="border-t border-gray-100 pt-6">\n              {true && (`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('StaffRegister.jsx updated successfully!');
