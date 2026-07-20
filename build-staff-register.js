const fs = require('fs');

try {
  let text = fs.readFileSync('apps/student-reg/src/pages/Register.jsx', 'utf8');

  // 1. Rename Component
  text = text.replace(/const Register = \(\) => \{/g, 'const StaffRegister = () => {');
  text = text.replace(/export default Register;/g, 'export default StaffRegister;');
  
  // 2. Add Imports
  text = text.replace(/import \{ FaCheck, FaArrowLeft, FaLine \} from 'react-icons\/fa';/, "import { FaCheck, FaArrowLeft, FaLine, FaHeartbeat, FaRunning, FaTools, FaCamera } from 'react-icons/fa';");

  // 3. Update initial state
  text = text.replace(
    /titlePrefix: '',/,
    "titlePrefix: '',\n      nickname: '',\n      year: '',\n      lineId: '',\n      role1: '',\n      role2: '',"
  );
  
  // 4. Update handleClearData
  text = text.replace(
    /newData\.titlePrefix = '';/,
    "newData.titlePrefix = '';\n          newData.nickname = '';\n          newData.year = '';\n          newData.lineId = '';\n          newData.role1 = '';\n          newData.role2 = '';"
  );
  
  // 5. Update handleChange (nationality clear)
  text = text.replace(
    /titlePrefix: '',\s*firstName: '',/g,
    "titlePrefix: '',\n        nickname: '',\n        year: '',\n        lineId: '',\n        role1: '',\n        role2: '',\n        firstName: '',"
  );

  // 6. Update handleNext
  // Step 1
  text = text.replace(
    /!formData\.studentIdStatus\)/,
    "!formData.studentIdStatus || !formData.nickname.trim() || !formData.year || !formData.lineId.trim())"
  );
  // Step 3
  const step3Regex = /\} else if \(step === 3\) \{[\s\S]*?\} else if \(step === 4 && !isEditMode\) \{/;
  const step3Replacement = `} else if (step === 3) {
      if (!formData.role1 || !formData.role2) {
        setError(t.errRequired);
        return;
      }
      if (formData.role1 === formData.role2) {
        setError(lang === 'TH' ? 'กรุณาเลือกตำแหน่งอันดับ 1 และ 2 ให้แตกต่างกัน' : 'Please select different roles for choice 1 and 2.');
        return;
      }
      
      if (!formData.hasDietaryRestriction || !formData.hasMedicalCondition) {
        setError(t.errRequired);
        return;
      }
      if (formData.hasDietaryRestriction === 'มี' && (!formData.dietaryRestriction || formData.dietaryRestriction.length === 0)) {
        setError(t.errRequired);
        return;
      }
      if (formData.hasDietaryRestriction === 'มี') {
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('แพ้อาหารบางชนิด') && !formData.foodAllergyDetails) {
          setError(t.errAllergy);
          return;
        }
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('อื่นๆ') && !formData.dietaryOther) {
          setError(t.errDietOther);
          return;
        }
      }
      if (formData.hasMedicalCondition === 'มี' && !formData.medicalConditionDetails) {
        setError(t.errMedical);
        return;
      }
    } else if (step === 4 && !isEditMode) {`;
  text = text.replace(step3Regex, step3Replacement);

  // 7. Remove PDPA Step Render and replace Step 3 Render
  // Remove step 4 render
  text = text.replace(new RegExp('\\\\{\\\\/\\\\* Step 4: PDPA \\\\*\\\\/\\\\}[\\\\s\\\\S]*?\\\\{\\\\/\\\\* Step 5: Verification Phase \\\\*\\\\/\\\\}'), '{/* Step 4: Verification Phase */}');
  
  // Replace step 3 render
  const step3HtmlRegex = new RegExp('\\\\{\\\\/\\\\* Step 3: ข้อมูลสำหรับการจัดกิจกรรม \\\\*\\\\/\\\\}[\\\\s\\\\S]*?\\\\{\\\\/\\\\* Step 4: Verification Phase \\\\*\\\\/\\\\}');
  
  const step3HtmlReplacement = `{/* Step 3: ข้อมูลสำหรับการจัดกิจกรรม */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.activityInfo}</h3>

              <div className="bg-white/60 p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn" style={{ animationDelay: '0.1s' }}>

              
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
                    <label className={labelClass}>ตำแหน่งที่ต้องการสมัคร (อันดับ 2) *</label>
                    <select name="role2" value={formData.role2} onChange={handleChange} className={inputClass}>
                      <option value="">-- เลือกตำแหน่งอันดับ 2 --</option>
                      <option value="พยาบาล">พยาบาล</option>
                      <option value="กิจกรรม">กิจกรรม</option>
                      <option value="สถานที่และสวัสดิการ">สถานที่และสวัสดิการ</option>
                      <option value="ประชาสัมพันธ์">ประชาสัมพันธ์</option>
                    </select>
                  </div>
                </div>
              </div>

              {true && (
                <div className="space-y-6 animate-fadeIn">
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
                          <input type="text" name="dietaryOther" value={formData.dietaryOther} onChange={handleChange} className={inputClass + " mt-3"} placeholder={t.foodAllergyPlaceholder} />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t.medicalCondition}</label>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <label className={radioLabelClass}>
                        <input type="radio" name="hasMedicalCondition" value="ไม่มี" onChange={handleChange} className={radioInputClass} checked={formData.hasMedicalCondition === "ไม่มี"} />
                        <span>{t.no}</span>
                      </label>
                      <label className={radioLabelClass}>
                        <input type="radio" name="hasMedicalCondition" value="มี" onChange={handleChange} className={radioInputClass} checked={formData.hasMedicalCondition === "มี"} />
                        <span>{t.yes}</span>
                      </label>
                    </div>

                    {formData.hasMedicalCondition === 'มี' && (
                      <div className="mt-3 animate-fadeIn">
                        <input type="text" name="medicalConditionDetails" value={formData.medicalConditionDetails} onChange={handleChange} className={inputClass} placeholder={t.medicalConditionPlaceholder} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

            </div>
          )}

          {/* Step 4: ตรวจสอบข้อมูล */}`;
  
  text = text.replace(step3HtmlRegex, step3HtmlReplacement);

  // 8. Update Stepper (totalSteps = 4, and remove step 4 PDPA logic)
  text = text.replace(/const totalSteps = isEditMode \? 4 : 5;/, 'const totalSteps = isEditMode ? 3 : 4;');
  text = text.replace(/\{ num: 4, label: t\.step4 \},/g, '');
  text = text.replace(/\{ num: 5, label: t\.step5 \}/g, '{ num: 4, label: t.step5 }');
  
  // Update step variables matching
  text = text.replace(/step === 5/g, 'step === 4');

  // 9. Add Nickname, Year, LineId to Step 1 Form HTML
  const step1HtmlRegex = /placeholder=\{formData\.nationality === 'ต่างชาติ' \? '69xxxxxxxxx' : '6907050xxxx'\}\s*\/\>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}/;
  
  const step1HtmlReplacement = `placeholder={formData.nationality === 'ต่างชาติ' ? '69xxxxxxxxx' : '6907050xxxx'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className={labelClass}>{lang === 'TH' ? 'ชื่อเล่น *' : 'Nickname *'}</label>
                    <input 
                      type="text" 
                      name="nickname" 
                      value={formData.nickname} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/[0-9!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]+/.test(val)) {
                          handleChange(e);
                        }
                      }} 
                      className={inputClass} 
                      placeholder={lang === 'TH' ? 'กรอกชื่อเล่น' : 'Nickname'} 
                    />
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
                  
                  <div className="mt-4">
                    <label className={labelClass}>Line ID *</label>
                    <input type="text" name="lineId" value={formData.lineId} onChange={handleChange} className={inputClass} placeholder="Line ID" />
                  </div>

                </div>
              )}

            </div>
          )}`;
  text = text.replace(step1HtmlRegex, step1HtmlReplacement);

  // 10. Update Firebase DB Collection and Cloud Function usage
  text = text.replace(/updateUser\((.*?)\);/g, 'updateUser($1, "staff_applicants");');
  text = text.replace(/registerUser\((.*?)\);/g, 'registerUser($1, "staff_applicants");');

  fs.writeFileSync('apps/student-reg/src/pages/StaffRegister.jsx', text, 'utf8');
  console.log('Successfully generated StaffRegister.jsx!');
} catch (e) {
  console.error(e);
}
