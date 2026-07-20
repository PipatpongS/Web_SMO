const fs = require('fs');

try {
  let text = fs.readFileSync('apps/student-reg/src/pages/Register.jsx', 'utf8');

  // 1. Rename Component and update imports
  text = text.replace(/const Register = \(\) => \{/g, 'const StaffRegister = () => {');
  text = text.replace(/export default Register;/g, 'export default StaffRegister;');
  text = text.replace(/import \{ FaCheck, FaArrowLeft, FaLine \} from 'react-icons\/fa';/, "import { FaCheck, FaArrowLeft, FaLine, FaHeartbeat, FaRunning, FaTools, FaCamera } from 'react-icons/fa';");

  // 2. Initial State & Clear Data
  text = text.replace(
    /studentIdStatus: 'ยังไม่ได้รับรหัสนักศึกษา',/g,
    "nickname: '',\n      year: '',\n      lineId: '',\n      role1: '',\n      role2: '',"
  );
  text = text.replace(
    /newData\.studentIdStatus = 'ยังไม่ได้รับรหัสนักศึกษา';/g,
    "newData.nickname = '';\n          newData.year = '';\n          newData.lineId = '';\n          newData.role1 = '';\n          newData.role2 = '';"
  );
  text = text.replace(
    /titlePrefix: '',\s*firstName: '',/g,
    "titlePrefix: '',\n        nickname: '',\n        year: '',\n        lineId: '',\n        role1: '',\n        role2: '',\n        firstName: '',"
  );

  // 3. Update handleChange
  // Add nickname, lineId, and studentId logic
  const handleChangePatch = `
    // Custom logic for Nickname and Line ID
    if (name === 'nickname' && typeof newValue === 'string') {
      if (formData.nationality === 'ไทย') {
        newValue = newValue.replace(/[^ก-๙a-zA-Z\\s]/g, '');
      } else {
        newValue = newValue.replace(/[^a-zA-Z\\s]/g, '');
      }
    }
    if (name === 'lineId' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^a-zA-Z0-9.\\-_~]/g, '');
    }
    
    // Only allow numbers in studentId, max 11 digits
    if (name === 'studentId' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 11) {
        newValue = newValue.slice(0, 11);
      }
    }

    let updates = { [name]: newValue };
    
    if (name === 'role1' && newValue === formData.role2) {
      updates.role2 = '';
    }
    if (name === 'role2' && newValue === formData.role1) {
      updates.role2 = '';
    }
  `;
  text = text.replace(/let updates = \{ \[name\]: newValue \};/, handleChangePatch);
  
  // Remove studentIdStatus logic from handleChange
  text = text.replace(/if \(name === 'studentIdStatus'\) \{[\s\S]*?\}\n\n/g, '');

  // 4. Update Steps Logic
  text = text.replace(/const totalSteps = isEditMode \? 4 : 5;/g, 'const totalSteps = isEditMode ? 5 : 6;');
  
  // Update step labels in TH
  text = text.replace(/step1: 'ทั่วไป',/, "step1: 'ข้อมูล',");
  text = text.replace(/step2: 'การศึกษา',/, "step2: 'ติดต่อ',");
  text = text.replace(/step3: 'ส่วนตัว',/, "step3: 'ตำแหน่ง',");
  text = text.replace(/step4: 'ยินยอม',/, "step4: 'สุขภาพ',");
  text = text.replace(/step5: 'ตรวจสอบ',/, "step5: 'ยินยอม',\n    step6: 'ตรวจสอบ',");
  // Update step labels in EN
  text = text.replace(/step1: 'General',/, "step1: 'Info',");
  text = text.replace(/step2: 'Education',/, "step2: 'Contact',");
  text = text.replace(/step3: 'Personal',/, "step3: 'Roles',");
  text = text.replace(/step4: 'Consent',/, "step4: 'Health',");
  text = text.replace(/step5: 'Verify',/, "step5: 'Consent',\n    step6: 'Verify',");
  
  // Replace setStep(5) with setStep(6) etc in various places
  text = text.replace(/step === 5/g, 'step === 6');
  text = text.replace(/setStep\(5\)/g, 'setStep(6)');
  
  // Replace the stepper arrays directly
  text = text.replace(
    /\{ num: 1, label: t\.step1 \},\s*\{ num: 2, label: t\.step2 \},\s*\{ num: 3, label: t\.step3 \},\s*\{ num: 4, label: t\.step4 \},\s*\{ num: 4, label: t\.step5 \}/,
    '{ num: 1, label: t.step1 },\n              { num: 2, label: t.step2 },\n              { num: 3, label: t.step3 },\n              { num: 4, label: t.step4 },\n              { num: 5, label: t.step6 }'
  );
  text = text.replace(
    /\{ num: 1, label: t\.step1 \},\s*\{ num: 2, label: t\.step2 \},\s*\{ num: 3, label: t\.step3 \},\s*\{ num: 4, label: t\.step4 \},\s*\{ num: 6, label: t\.step5 \}/,
    '{ num: 1, label: t.step1 },\n              { num: 2, label: t.step2 },\n              { num: 3, label: t.step3 },\n              { num: 4, label: t.step4 },\n              { num: 5, label: t.step5 },\n              { num: 6, label: t.step6 }'
  );
  
  // Replace validateAll and handleNext
  const newValidations = `
    if (step === 1) {
      if (!formData.titlePrefix || !formData.firstName.trim() || !formData.lastName.trim() || !formData.nationality || !formData.nickname.trim() || !formData.year || !formData.department) {
        setError(t.errRequired); return false;
      }
      if (formData.studentId.length !== 11 || formData.studentId[0] !== '6') {
        setError(lang === 'TH' ? 'กรุณากรอกรหัสนักศึกษาให้ครบ 11 หลัก และต้องขึ้นต้นด้วยเลข 6' : 'Student ID must be 11 digits and start with 6');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.lineId.trim() || !formData.phone || !formData.email) {
        setError(t.errRequired); return false;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email) || formData.email.includes('..')) {
        setError(t.errEmailFormat); return false;
      }
      if (formData.phone.length !== 10 || formData.phone[0] !== '0' || formData.phone[1] === '0') {
        setError(t.errPhoneFormat); return false;
      }
    }
    if (step === 3) {
      if (!formData.role1 || !formData.role2 || formData.role1 === formData.role2) {
        setError(t.errRequired); return false;
      }
    }
    if (step === 4) {
      if (!formData.hasDietaryRestriction || !formData.hasMedicalCondition) {
        setError(t.errRequired); return false;
      }
      if (formData.hasDietaryRestriction === 'มี' && (!formData.dietaryRestriction || formData.dietaryRestriction.length === 0)) {
        setError(t.errRequired); return false;
      }
      if (formData.hasDietaryRestriction === 'มี') {
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('แพ้อาหารบางชนิด') && !formData.foodAllergyDetails) {
          setError(t.errAllergy); return false;
        }
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('อื่นๆ') && !formData.dietaryOther) {
          setError(t.errDietOther); return false;
        }
      }
      if (formData.hasMedicalCondition === 'มี' && !formData.medicalConditionDetails) {
        setError(t.errMedical); return false;
      }
    }
    if (step === 5 && !isEditMode) {
      if (!formData.pdpaConsent) {
        setError(lang === 'TH' ? 'กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ' : 'Please accept the terms before proceeding');
        return false;
      }
    }`;

  const handleNextRegex = /const handleNext = \(\) => \{[\s\S]*?return next;\s*\}\);\s*\};/;
  const validateAllRegex = /const validateAll = \(\) => \{[\s\S]*?return true;\s*\};/;
  const handleClearStepRegex = /const handleClearStep = \(\) => \{[\s\S]*?\}\);/;

  text = text.replace(handleNextRegex, `const handleNext = () => {
    setError('');
    const isValid = (() => {${newValidations} return true;})();
    if (!isValid) {
      return;
    }
    setStep(prev => {
      const next = prev + 1;
      if (next > maxStep) setMaxStep(next);
      window.scrollTo(0, 0);
      return next;
    });
  };`);

  text = text.replace(validateAllRegex, `const validateAll = () => {
    setError('');
    let step = 1;
    ${newValidations.replace(/return false;/g, 'setStep(step); return false;').replace(/if \\(step === (\\d)\\) \\{/g, 'step = $1;\n    if (true) {')}
    return true;
  };`);


  // 5. Build HTML Steps from scratch
  const htmlStartIdx = text.indexOf('{/* Step 1: ข้อมูลส่วนบุคคลและติดต่อ */}');
  const verifyStartIdx = text.indexOf('{/* Step 5: Verification Phase */}'); // which was changed to 6 earlier?
  
  if (htmlStartIdx === -1) {
    console.log("Could not find HTML start index");
  }

  // We will replace everything from htmlStartIdx to the verifyStartIdx with our custom HTML steps
  
  const step1Html = `{/* Step 1: ข้อมูลส่วนบุคคล */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.personalInfo}</h3>
              
              <div className="border-b border-gray-100 pb-6 mb-6">
                <label className={labelClass}>{t.nationality}</label>
                <div onClickCapture={(e) => { if (isFieldLocked('nationality')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <label className={\`\${radioLabelClass} \${isFieldLocked('nationality') ? 'opacity-60 !bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`}>
                      <input type="radio" name="nationality" value="ไทย" onChange={handleChange} className={radioInputClass} checked={formData.nationality === "ไทย"} />
                      <span>{t.thaiNat}</span>
                    </label>
                    <label className={\`\${radioLabelClass} \${isFieldLocked('nationality') ? 'opacity-60 !bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`}>
                      <input type="radio" name="nationality" value="ต่างชาติ" onChange={handleChange} className={radioInputClass} checked={formData.nationality === "ต่างชาติ"} />
                      <span>{t.intNat}</span>
                    </label>
                  </div>
                </div>
              </div>

              {formData.nationality && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1">
                      <label className={labelClass}>{t.prefix}</label>
                      <div onClickCapture={(e) => { if (isFieldLocked('titlePrefix')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                        <select name="titlePrefix" value={formData.titlePrefix} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('titlePrefix') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`}>
                          <option value="" disabled>{t.selectPrefix}</option>
                          <option value="นาย">{t.mr}</option>
                          <option value="นางสาว">{t.ms}</option>
                          <option value="นาง">{t.mrs}</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>{t.firstName}</label>
                        <div onClickCapture={(e) => { if (isFieldLocked('firstName')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('firstName') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`} placeholder={t.firstNamePlaceholder} />
                        </div>
                      </div>
                      
                      <div>
                        <label className={labelClass}>{t.lastName}</label>
                        <div onClickCapture={(e) => { if (isFieldLocked('lastName')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('lastName') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`} placeholder={t.lastNamePlaceholder} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t.middleName} <span className="text-gray-400 font-normal">{t.middleNameOpt}</span></label>
                    <div onClickCapture={(e) => { if (isFieldLocked('middleName')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                      <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('middleName') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`} placeholder={t.middleNamePlaceholder} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelClass}>{lang === 'TH' ? 'ชื่อเล่น *' : 'Nickname *'}</label>
                    <input 
                      type="text" 
                      name="nickname" 
                      value={formData.nickname} 
                      onChange={handleChange} 
                      className={inputClass} 
                      placeholder={lang === 'TH' ? 'กรอกชื่อเล่น' : 'Nickname'} 
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{lang === 'TH' ? 'รหัสนักศึกษา *' : 'Student ID *'}</label>
                    <div onClickCapture={(e) => { if (isFieldLocked('studentId')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                      <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('studentId') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`} placeholder="69xxxxxxxxx" />
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass}>{t.department}</label>
                    <div onClickCapture={(e) => { if (isFieldLocked('department')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                      <select name="department" value={formData.department} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('department') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`}>
                        <option value="" disabled>{t.selectDept}</option>
                        <option value="วิศวกรรมคอมพิวเตอร์">{t.deptCPE}</option>
                        <option value="วิศวกรรมโยธา">{t.deptCE}</option>
                        <option value="วิศวกรรมเคมี">{t.deptChE}</option>
                        <option value="วิศวกรรมไฟฟ้า">{t.deptEE}</option>
                        <option value="วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม">{t.deptENE}</option>
                        <option value="วิศวกรรมสิ่งแวดล้อม">{t.deptENV}</option>
                        <option value="วิศวกรรมระบบควบคุมและเครื่องมือวัด">{t.deptINC}</option>
                        <option value="วิศวกรรมเครื่องกล">{t.deptME}</option>
                        <option value="วิศวกรรมอุตสาหการ">{t.deptPE}</option>
                        <option value="วิศวกรรมเครื่องมือและวัสดุ">{t.deptTME}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelClass}>{lang === 'TH' ? 'ชั้นปี *' : 'Year *'}</label>
                    <select name="year" value={formData.year} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกชั้นปี --</option>
                      <option value="1">ปี 1</option>
                      <option value="2">ปี 2</option>
                      <option value="3">ปี 3</option>
                      <option value="4">ปี 4</option>
                    </select>
                  </div>

                </div>
              )}
            </div>
          )}
  `;

  const step2Html = `{/* Step 2: ข้อมูลการติดต่อ */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{lang === 'TH' ? 'ข้อมูลการติดต่อ' : 'Contact Information'}</h3>
              
              <div>
                <label className={labelClass}>Line ID *</label>
                <input type="text" name="lineId" value={formData.lineId} onChange={handleChange} className={inputClass} placeholder="Line ID" />
              </div>

              <div>
                <label className={labelClass}>{t.phone}</label>
                <div onClickCapture={(e) => { if (isFieldLocked('phone')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('phone') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`} placeholder={t.phonePlaceholder} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t.email}</label>
                <div onClickCapture={(e) => { if (isFieldLocked('email')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={\`\${inputClass} \${isFieldLocked('email') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`} placeholder={t.emailPlaceholder} />
                </div>
              </div>
            </div>
          )}
  `;

  const step3Html = `{/* Step 3: ตำแหน่งที่สมัคร */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{lang === 'TH' ? 'ตำแหน่งที่สมัคร (Roles)' : 'Roles & Motivation'}</h3>

              <div className="bg-white/60 p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">ตำแหน่งที่เปิดรับสมัคร</h4>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                    <h5 className="font-bold text-[#1e3a5f] mb-1 flex items-center"><FaHeartbeat className="mr-2 text-red-500"/> ฝ่ายพยาบาล (10 คน)</h5>
                    <ul className="text-[13px] text-gray-600 space-y-1">
                      <li><strong>วันที่:</strong> 26 กรกฎาคม 2569</li>
                      <li><strong>หน้าที่:</strong> แจกไม้แอมโมเนียให้น้อง และส่งต่อน้องให้ EMS</li>
                      <li className="text-red-500"><strong>หมายเหตุ:</strong> ไม่จำเป็นต้องมีบัตรพยาบาล</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                    <h5 className="font-bold text-[#1e3a5f] mb-1 flex items-center"><FaRunning className="mr-2 text-orange-500"/> ฝ่ายกิจกรรม (40 คน)</h5>
                    <ul className="text-[13px] text-gray-600 space-y-1">
                      <li><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</li>
                      <li><strong>หน้าที่:</strong> จัดกิจกรรมให้น้อง ๆ, นำวิ่งรับเกียร์, ทำกิจกรรมบูมต้อนรับ</li>
                      <li className="text-orange-500"><strong>หมายเหตุ:</strong> มีการซ้อมกิจกรรมวันที่ 21 และ 23 กรกฏาคม 2569</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                    <h5 className="font-bold text-[#1e3a5f] mb-1 flex items-center"><FaTools className="mr-2 text-slate-500"/> ฝ่ายสถานที่และสวัสดิการ (10 คน)</h5>
                    <ul className="text-[13px] text-gray-600 space-y-1">
                      <li><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</li>
                      <li><strong>หน้าที่:</strong> ช่วยเคลื่อนย้าย จัดวางอุปกรณ์ต่างๆ, แจกอาหารว่างและเครื่องดื่ม, หน้าที่อื่นๆ ที่ได้รับมอบหมาย</li>
                      <li className="text-orange-500"><strong>หมายเหตุ:</strong> มีการนัดหมายจัดสถานที่ วันที่ 24 กรกฎาคม 2569</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                    <h5 className="font-bold text-[#1e3a5f] mb-1 flex items-center"><FaCamera className="mr-2 text-blue-500"/> ประชาสัมพันธ์ (3 คน)</h5>
                    <ul className="text-[13px] text-gray-600 space-y-1">
                      <li><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</li>
                      <li><strong>หน้าที่:</strong> เก็บบรรยากาศภายในกิจกรรม, จัดทำคลิป และเนื้อหาประชาสัมพันธ์ เผยแพร่ผ่านช่องทางออนไลน์, หน้าที่อื่นๆ ที่ได้รับมอบหมาย</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>ฝ่าย/ตำแหน่งที่ต้องการสมัคร (อันดับ 1) *</label>
                    <select name="role1" value={formData.role1} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกตำแหน่งอันดับ 1 --</option>
                      <option value="พยาบาล">พยาบาล</option>
                      <option value="กิจกรรม">กิจกรรม</option>
                      <option value="สถานที่และสวัสดิการ">สถานที่และสวัสดิการ</option>
                      <option value="ประชาสัมพันธ์">ประชาสัมพันธ์</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>ฝ่าย/ตำแหน่งที่ต้องการสมัคร (อันดับ 2) *</label>
                    <select name="role2" value={formData.role2} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกตำแหน่งอันดับ 2 --</option>
                      {['พยาบาล', 'กิจกรรม', 'สถานที่และสวัสดิการ', 'ประชาสัมพันธ์']
                        .filter(role => role !== formData.role1)
                        .map(role => (
                          <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
  `;

  const step4Html = `{/* Step 4: สุขภาพและสวัสดิการ */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.activityInfo}</h3>

              <div className="border-t border-gray-100 pt-6">
                <label className={labelClass}>{t.diet}</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className={radioLabelClass}>
                    <input type="radio" name="hasDietaryRestriction" value="ไม่มี" onChange={handleChange} className={radioInputClass} checked={formData.hasDietaryRestriction === "ไม่มี"} />
                    <span>{t.dietNo}</span>
                  </label>
                  <label className={radioLabelClass}>
                    <input type="radio" name="hasDietaryRestriction" value="มี" onChange={handleChange} className={radioInputClass} checked={formData.hasDietaryRestriction === "มี"} />
                    <span>{t.dietYes}</span>
                  </label>
                </div>

                {formData.hasDietaryRestriction === 'มี' && (
                  <div className="mt-4 animate-fadeIn">
                    <p className="text-sm text-gray-500 mb-2">{lang === 'TH' ? '(สามารถเลือกได้หลายข้อ)' : '(You can select multiple options)'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { val: 'อิสลาม (ฮาลาล)', label: t.dietHalal },
                        { val: 'มังสวิรัติ', label: t.dietVeg },
                        { val: 'วีแกน', label: t.dietVegan },
                        { val: 'แพ้อาหารบางชนิด', label: t.dietAllergy },
                        { val: 'อื่นๆ', label: t.other }
                      ].map(option => (
                        <label key={option.val} className={radioLabelClass}>
                          <input type="checkbox" name="dietaryRestriction" value={option.val} onChange={handleChange} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2" checked={Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes(option.val)} />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    {Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('แพ้อาหารบางชนิด') && (
                      <input type="text" name="foodAllergyDetails" value={formData.foodAllergyDetails} onChange={handleChange} className={inputClass + " mt-3"} placeholder={t.foodAllergyPlaceholder} />
                    )}
                    {Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('อื่นๆ') && (
                      <input type="text" name="dietaryOther" value={formData.dietaryOther} onChange={handleChange} className={inputClass + " mt-3"} placeholder={t.dietOtherPlaceholder} />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>{t.medical}</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className={radioLabelClass}>
                    <input type="radio" name="hasMedicalCondition" value="ไม่มี" onChange={handleChange} className={radioInputClass} checked={formData.hasMedicalCondition === "ไม่มี"} />
                    <span>{t.medicalNo}</span>
                  </label>
                  <label className={radioLabelClass}>
                    <input type="radio" name="hasMedicalCondition" value="มี" onChange={handleChange} className={radioInputClass} checked={formData.hasMedicalCondition === "มี"} />
                    <span>{t.medicalYes}</span>
                  </label>
                </div>

                {formData.hasMedicalCondition === 'มี' && (
                  <div className="mt-3 animate-fadeIn">
                    <input type="text" name="medicalConditionDetails" value={formData.medicalConditionDetails} onChange={handleChange} className={inputClass} placeholder={t.medicalPlaceholder} />
                  </div>
                )}
              </div>
            </div>
          )}
  `;

  const step5Html = `{/* Step 5: การยินยอม */}
          {!isEditMode && step === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.pdpaTitle}</h3>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed">
                <p className="text-gray-600 mb-2">{t.pdpaTextStaff}</p>
              </div>

              <label className="flex items-start space-x-4 cursor-pointer mt-6 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name="pdpaConsent"
                  checked={formData.pdpaConsent}
                  onChange={handleChange}
                  disabled={readOnly}
                  className={\`\${radioInputClass} mt-1 rounded \${readOnly ? 'cursor-not-allowed opacity-60' : ''}\`}
                />
                <span className="text-sm text-gray-700">
                  {t.pdpaConsentStaff}
                </span>
              </label>
            </div>
          )}
  `;

  // Actually find where Step 5 originally was
  let verificationRegex = /\{\/\* Step 5: Verification Phase \*\/\}[\s\S]*?\{step === 5/g;
  let verificationStrIdx = -1;
  text.replace(verificationRegex, (match, offset) => {
    verificationStrIdx = offset;
    return match;
  });
  
  if (verificationStrIdx === -1) {
     verificationStrIdx = text.indexOf('{/* Step 5: Verification Phase */}');
  }

  if (htmlStartIdx !== -1 && verificationStrIdx !== -1) {
    const fullReplacement = step1Html + step2Html + step3Html + step4Html + step5Html + '\n';
    text = text.slice(0, htmlStartIdx) + fullReplacement + text.slice(verificationStrIdx);
  }

  // Patch Verification Phase for new structure
  text = text.replace(/\{\/\* Step 5: Verification Phase \*\/\}/, '{/* Step 6: Verification Phase */}');
  
  // Replace everything from {/* General Info */} up to {/* Activity Info */}
  const verifyPhaseRegex = /\{\/\* General Info \*\/\}[\s\S]*?\{\/\* Activity Info \*\/\}/;
  
  const newVerifyGeneral = `{/* General Info */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{t.generalInfo}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(1); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.nationality.replace(' *', '')}</span><p className="font-medium text-gray-800">{translateValue(formData.nationality)}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{lang === 'TH' ? 'ชื่อ-นามสกุล' : 'Full Name'}</span><p className="font-medium text-gray-800">{\`\${translateValue(formData.titlePrefix)} \${formData.firstName} \${formData.middleName ? formData.middleName + ' ' : ''}\${formData.lastName}\`}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{lang === 'TH' ? 'ชื่อเล่น' : 'Nickname'}</span><p className="font-medium text-gray-800">{formData.nickname}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{lang === 'TH' ? 'รหัสนักศึกษา' : 'Student ID'}</span><p className="font-medium text-gray-800">{formData.studentId}</p></div>
                    <div className="sm:col-span-1"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.department.replace(' *', '')}</span><p className="font-medium text-gray-800">{translateValue(formData.department)}</p></div>
                    <div className="sm:col-span-1"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{lang === 'TH' ? 'ชั้นปี' : 'Year'}</span><p className="font-medium text-gray-800">{formData.year}</p></div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{lang === 'TH' ? 'ข้อมูลการติดต่อ' : 'Contact Info'}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(2); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">Line ID</span><p className="font-medium text-gray-800">{formData.lineId}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.phone.replace(' *', '')}</span><p className="font-medium text-gray-800">{formData.phone}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.email.replace(' *', '')}</span><p className="font-medium text-gray-800 break-all">{formData.email}</p></div>
                  </div>
                </div>

                {/* Roles */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{lang === 'TH' ? 'ตำแหน่งที่สมัคร' : 'Roles'}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(3); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">ตำแหน่งที่สมัคร (อันดับ 1)</span><p className="font-medium text-gray-800">{formData.role1}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">ตำแหน่งที่สมัคร (อันดับ 2)</span><p className="font-medium text-gray-800">{formData.role2}</p></div>
                  </div>
                </div>

                {/* Activity Info */}`;
  
  text = text.replace(verifyPhaseRegex, newVerifyGeneral);

  // Patch Activity Info to remove joinActivity
  text = text.replace(/<div><span className="text-gray-400 block mb-1\.5 text-xs uppercase tracking-wider">\{t\.join\.replace\(' \*', ''\)\}<\/span>[\s\S]*?\{formData\.joinActivity === 'เข้าร่วม' && \(/, '{true && (');

  // Fix edit button in Activity Info section to point to step 4 instead of 3
  text = text.replace(/onClick=\{\(\) => \{ setStep\(3\); window\.scrollTo\(0, 0\); \}\}/, "onClick={() => { setStep(4); window.scrollTo(0, 0); }}");

  // Fix Firebase Database Collection
  text = text.replace(/updateUser\((.*?)\);/g, 'updateUser($1, "staff_applicants");');
  text = text.replace(/registerUser\((.*?)\);/g, 'registerUser($1, "staff_applicants");');
  text = text.replace(/<Layout>/, '<Layout>\n      <StaffMenu />');

  // Fix Verify step pdpa text to use staff versions
  text = text.replace(/\{t\.pdpaText1\}/g, '{t.pdpaTextStaff}');
  text = text.replace(/\{t\.pdpaConsent\}/g, '{t.pdpaConsentStaff}');

  // Write output
  fs.writeFileSync('apps/student-reg/src/pages/StaffRegister.jsx', text, 'utf8');
  console.log('Successfully generated StaffRegister.jsx using build-staff-register3.js!');
} catch (e) {
  console.error(e);
}
