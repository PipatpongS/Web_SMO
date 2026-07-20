const fs = require('fs');

try {
  let text = fs.readFileSync('apps/student-reg/src/pages/StaffRegister.jsx', 'utf8');
  const registerText = fs.readFileSync('apps/student-reg/src/pages/Register.jsx', 'utf8');

  // 1. Fix handleChange
  // We will extract the full handleChange from Register.jsx and insert it into StaffRegister.jsx, 
  // then patch it for StaffRegister.
  const handleChangeRegex = /const handleChange = \(e\) => \{[\s\S]*?setFormData\(\{ \.\.\.formData, \.\.\.updates \}\);\n  \};/;
  const registerHandleChangeMatch = registerText.match(handleChangeRegex);
  
  if (registerHandleChangeMatch) {
    let newHandleChange = registerHandleChangeMatch[0];
    
    // Patch nationality clearing
    newHandleChange = newHandleChange.replace(
      /titlePrefix: '',\s+firstName: '',/g,
      "titlePrefix: '',\n        nickname: '',\n        year: '',\n        lineId: '',\n        role1: '',\n        role2: '',\n        firstName: '',"
    );
    
    // Replace the broken handleChange in StaffRegister.jsx
    // The broken one starts at `const handleChange` and ends at `setFormData({ ...formData, ...updates });\n  };`
    // Wait, the broken one might be malformed. Let's just use regex to find what's left of it.
    const brokenHandleChangeRegex = /const handleChange = \(e\) => \{[\s\S]*?setFormData\(\{ \.\.\.formData, \.\.\.updates \}\);\n  \};/;
    if (brokenHandleChangeRegex.test(text)) {
      text = text.replace(brokenHandleChangeRegex, newHandleChange);
      console.log('Fixed handleChange');
    } else {
      console.log('Could not find broken handleChange to replace');
    }
  }

  // 2. Fix handleNext
  // Extract handleNext from Register.jsx and patch it for StaffRegister
  const handleNextRegex = /const handleNext = \(\) => \{[\s\S]*?return next;\n    \}\);\n  \};/;
  const registerHandleNextMatch = registerText.match(handleNextRegex);
  
  if (registerHandleNextMatch) {
    let newHandleNext = registerHandleNextMatch[0];
    
    // Patch step 1
    newHandleNext = newHandleNext.replace(
      /!formData\.studentIdStatus\)/,
      "!formData.studentIdStatus || !formData.nickname.trim() || !formData.year || !formData.lineId.trim())"
    );
    
    // Patch step 3
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
    
    newHandleNext = newHandleNext.replace(step3Regex, step3Replacement);
    
    const brokenHandleNextRegex = /const handleNext = \(\) => \{[\s\S]*?return next;\n    \}\);\n  \};/;
    if (brokenHandleNextRegex.test(text)) {
      text = text.replace(brokenHandleNextRegex, newHandleNext);
      console.log('Fixed handleNext');
    } else {
      console.log('Could not find broken handleNext to replace');
    }
  }

  fs.writeFileSync('apps/student-reg/src/pages/StaffRegister.jsx', text, 'utf8');
  console.log('Done fixing script logic.');
} catch (e) {
  console.error(e);
}
