const fs = require('fs');
const filePath = 'apps/student-reg/src/pages/StaffRegister.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        console.error('Error parsing saved form data', e);
  const [isEditMode, setIsEditMode] = useState(false);`;

const target2 = `        console.error('Error parsing saved form data', e);
      }
    }
    return {
      titlePrefix: '',
      email: '',
      firstName: '',
      middleName: '',
  const [isEditMode, setIsEditMode] = useState(false);`;

const target3 = `        console.error('Error parsing saved form data', e);
      }
    }
    return {
      titlePrefix: '',
      email: '',
      firstName: '',
      middleName: '',
  const [step, setStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);`;

const replacement = `        console.error('Error parsing saved form data', e);
      }
    }
    return {
      titlePrefix: '',
      email: '',
      firstName: '',
      middleName: '',
      lastName: '',
      studentIdStatus: '',
      studentId: '',
      phone: '',
      nationality: '',
      program: '',
      department: '',
      shirtSize: '',
      hasDietaryRestriction: '',
      dietaryRestriction: [],
      foodAllergyDetails: '',
      dietaryOther: '',
      hasMedicalCondition: '',
      medicalConditionDetails: '',
      role1: '',
      role2: '',
      joinActivity: '',
      pdpaConsent: false
    };
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [maxStep, setMaxStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);`;

// Regex to catch the current state of the damaged area
const repairRegex = /console\.error\('Error parsing saved form data', e\);\r?\n(?:[\s\S]*?)const \[isEditMode, setIsEditMode\] = useState\(false\);/;

if (repairRegex.test(content)) {
  content = content.replace(repairRegex, replacement);
}

// Now replace the readOnly bug
content = content.replace(/if \(readOnly\) \{\s*setStep\(4\);\s*\/\/\stotalSteps\sfor\seditMode\sis\s4\s*setMaxStep\(4\);\s*\}/g, `if (readOnly) {\n        setStep(5);\n        setMaxStep(5);\n      }`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Repaired!');
