import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { isBeforeRegistration, isAfterRegistration } from '../config/timeConfig';
import { useRegistration } from '../contexts/RegContext';

const contentLang = {
  TH: {
    langBtn: 'TH',
    step1: 'ทั่วไป',
    step2: 'การศึกษา',
    step3: 'ส่วนตัว',
    step4: 'ยินยอม',
    step5: 'ตรวจสอบ',
    generalInfo: 'ข้อมูลทั่วไป',
    nationality: 'สัญชาติ *',
    thaiNat: 'ไทย',
    intNat: 'ต่างชาติ',
    prefix: 'คำนำหน้า *',
    selectPrefix: '-- เลือก --',
    mr: 'นาย',
    ms: 'นางสาว',
    mrs: 'นาง',
    firstName: 'ชื่อจริง *',
    firstNamePlaceholder: 'ไม่ต้องระบุคำนำหน้า',
    middleName: 'ชื่อกลาง',
    middleNameOpt: '(ถ้ามี)',
    middleNamePlaceholder: 'ชื่อกลาง (ถ้ามี)',
    lastName: 'นามสกุล *',
    lastNamePlaceholder: 'นามสกุล',
    email: 'อีเมล *',
    emailPlaceholder: 'example@gmail.com',
    phone: 'เบอร์โทรศัพท์ *',
    phonePlaceholder: 'กรอกเบอร์โทรศัพท์ของคุณ',
    studentIdStatus: 'สถานะรหัสนักศึกษา *',
    studentIdReceived: 'ได้รับรหัสนักศึกษาแล้ว',
    studentIdNotReceived: 'ยังไม่ได้รับรหัสนักศึกษา',
    studentId: 'รหัสนักศึกษา (เติมรหัส 4 ตัวท้าย) *',
    studentIdPlaceholder: '6907050xxxx',
    eduInfo: 'ข้อมูลการศึกษา',
    program: 'โครงการ *',
    regular: 'โครงการภาษาไทย',
    international: 'โครงการนานาชาติ',
    department: 'ภาควิชา *',
    selectDept: '-- กรุณาเลือกภาควิชา --',
    deptCPE: 'วิศวกรรมคอมพิวเตอร์',
    deptCE: 'วิศวกรรมโยธา',
    deptChE: 'วิศวกรรมเคมี',
    deptEE: 'วิศวกรรมไฟฟ้า',
    deptENE: 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม',
    deptENV: 'วิศวกรรมสิ่งแวดล้อม',
    deptINC: 'วิศวกรรมระบบควบคุมและเครื่องมือวัด',
    deptME: 'วิศวกรรมเครื่องกล',
    deptPE: 'วิศวกรรมอุตสาหการ',
    deptTME: 'วิศวกรรมเครื่องมือและวัสดุ',
    activityInfo: 'ข้อมูลส่วนตัว',
    shirtSize: 'ไซซ์เสื้อ *',
    selectShirtSize: '-- กรุณาเลือกไซซ์เสื้อ --',
    other: 'อื่น ๆ',
    shirtSizePlaceholder: 'กรุณาระบุไซซ์เสื้อ',
    diet: 'ข้อจำกัดด้านอาหาร *',
    dietYes: 'มี',
    dietNo: 'ไม่มี',
    dietAllergy: 'แพ้อาหารบางชนิด (เลือกเพื่อระบุเพิ่มเติม)',
    dietHalal: 'อิสลาม (ฮาลาล)',
    dietVeg: 'มังสวิรัติ',
    dietVegan: 'วีแกน',
    foodAllergyPlaceholder: 'ระบุอาหารที่แพ้ *',
    dietOtherPlaceholder: 'ระบุข้อจำกัดอื่น ๆ *',
    medical: 'โรคประจำตัว *',
    medicalNo: 'ไม่มี',
    medicalYes: 'มี',
    medicalPlaceholder: 'ระบุโรคประจำตัว *',
    join: 'ความสะดวกเข้าร่วมกิจกรรม *',
    joinYes: 'เข้าร่วม',
    joinNo: 'ไม่เข้าร่วม',
    joinNoNote: '* สามารถรับเสื้อได้ในวันเวลาที่กำหนด หรือภายหลัง',
    pdpaTitle: 'เงื่อนไขและการยินยอม',
    pdpaText1: 'ข้อมูลส่วนบุคคลที่นักศึกษากรอกในแบบฟอร์มนี้ จะถูกนำไปใช้เพื่อวัตถุประสงค์ในการจัดกิจกรรมภายในโครงการปฐมนิเทศนักศึกษาใหม่ คณะวิศวกรรมศาสตร์ ปีการศึกษา 2569 เท่านั้น',
    pdpaConsent: 'นักศึกษายินยอมให้มีการเก็บรวบรวมและใช้ข้อมูลส่วนบุคคล *',
    btnBackHome: 'ย้อนกลับไปหน้าหลัก',
    btnBack: 'ย้อนกลับ',
    btnNext: 'ถัดไป',
    btnSubmit: 'ยืนยันลงทะเบียน',
    btnEditSubmit: 'บันทึกการแก้ไขข้อมูล',
    btnSubmitting: 'กำลังบันทึก...',
    btnClear: 'ล้างการกรอกหน้านี้',
    confirmClear: 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลในหน้านี้?',
    errRequired: 'กรุณากรอกข้อมูลในส่วนนี้ให้ครบถ้วน',
    errAllergy: 'กรุณาระบุอาหารที่แพ้',
    errDietOther: 'กรุณาระบุข้อจำกัดด้านอาหารอื่น ๆ',
    errMedical: 'กรุณาระบุโรคประจำตัว',
    errEmailFormat: 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น example@gmail.com)',
    errPhoneFormat: 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (ขึ้นต้นด้วย 0 และตัวที่สองห้ามเป็น 0)',
    errStudentIdFormat: 'กรุณากรอกรหัสนักศึกษาให้ครบ 11 หลัก (ต้องขึ้นต้นด้วย 6907050)',
    errRegister: 'เกิดข้อผิดพลาดในการลงทะเบียน',
    errPermissionDenied: 'การบันทึกถูกปฏิเสธ: ตรวจสอบสิทธิ์การแก้ไขหรือคุณอาจหมดเขตเวลาในการแก้ไขแล้ว',
    errUnknown: 'เกิดข้อผิดพลาดที่ไม่รู้จัก: ',
    verifyTitle: 'ตรวจสอบข้อมูล',
    editDataBtn: 'แก้ไขข้อมูล'
  },
  EN: {
    langBtn: 'EN',
    step1: 'General',
    step2: 'Education',
    step3: 'Personal',
    step4: 'Consent',
    step5: 'Verify',
    generalInfo: 'General Information',
    nationality: 'Nationality *',
    thaiNat: 'Thai national',
    intNat: 'International student',
    prefix: 'Title *',
    selectPrefix: '-- Select --',
    mr: 'Mr.',
    ms: 'Ms.',
    mrs: 'Mrs.',
    firstName: 'First Name *',
    firstNamePlaceholder: 'No title needed',
    middleName: 'Middle Name',
    middleNameOpt: '(Optional)',
    middleNamePlaceholder: 'Middle Name (Optional)',
    lastName: 'Last Name *',
    lastNamePlaceholder: 'Last Name',
    email: 'Email *',
    emailPlaceholder: 'example@gmail.com',
    phone: 'Phone number *',
    phonePlaceholder: 'Enter your phone number',
    studentIdStatus: 'Student ID Status *',
    studentIdReceived: 'Received Student ID',
    studentIdNotReceived: 'Not yet received Student ID',
    studentId: 'Student ID (fill in the last 9 digits) *',
    studentIdPlaceholder: '6907050xxxx',
    eduInfo: 'Education Information',
    program: 'Program *',
    regular: 'Thai Program',
    international: 'International Program',
    department: 'Department *',
    selectDept: '-- Please select department --',
    deptCPE: 'Computer Engineering',
    deptCE: 'Civil Engineering',
    deptChE: 'Chemical Engineering',
    deptEE: 'Electrical Engineering',
    deptENE: 'Electronics and Telecomm Engineering',
    deptENV: 'Environmental Engineering',
    deptINC: 'Control Systems and Instrumentation Engineering',
    deptME: 'Mechanical Engineering',
    deptPE: 'Production Engineering',
    deptTME: 'Tools and Materials Engineering',
    activityInfo: 'Personal Information',
    shirtSize: 'T-shirt Size *',
    selectShirtSize: '-- Please select T-shirt size --',
    other: 'Other',
    shirtSizePlaceholder: 'Please specify T-shirt size',
    diet: 'Dietary Restrictions *',
    dietYes: 'Yes',
    dietNo: 'None',
    dietAllergy: 'Food allergy (select to specify further)',
    dietHalal: 'Muslim (Halal)',
    dietVeg: 'Vegetarian',
    dietVegan: 'Vegan',
    foodAllergyPlaceholder: 'Specify food allergy *',
    dietOtherPlaceholder: 'Specify other restrictions *',
    medical: 'Medical conditions *',
    medicalNo: 'No',
    medicalYes: 'Yes',
    medicalPlaceholder: 'Specify medical condition *',
    join: 'Join Activity *',
    joinYes: 'Join',
    joinNo: 'Not Join',
    joinNoNote: '* You can receive the T-shirt on the specified date/time or later.',
    pdpaTitle: 'Terms and Consent',
    pdpaText1: 'The personal information provided in this form will be used solely for organizing the Faculty of Engineering Orientation Program, Academic Year 2026.',
    pdpaConsent: 'I consent to the collection and use of my personal data *',
    btnBackHome: 'Back to Home',
    btnBack: 'Back',
    btnNext: 'Next',
    btnSubmit: 'Confirm Registration',
    btnEditSubmit: 'Save Changes',
    btnSubmitting: 'Saving...',
    btnClear: 'Clear this page',
    confirmClear: 'Are you sure you want to clear the data on this page?',
    errRequired: 'Please complete all required fields in this section',
    errAllergy: 'Please specify food allergy',
    errDietOther: 'Please specify other dietary restrictions',
    errMedical: 'Please specify medical condition',
    errEmailFormat: 'Please enter a valid email format (e.g. example@gmail.com)',
    errPhoneFormat: 'Please enter a 10-digit phone number (starting with 0, second digit not 0)',
    errStudentIdFormat: 'Please enter an 11-digit Student ID starting with 69',
    errRegister: 'Registration failed',
    errPermissionDenied: 'Permission denied: Check your edit permissions or the deadline may have passed.',
    errUnknown: 'Unknown error occurred: ',
    verifyTitle: 'Verify Information',
    editDataBtn: 'Edit Information'
  }
};
// from '../contexts/RegContext';
import { FaCheck, FaArrowLeft, FaLine } from 'react-icons/fa';
import logoImg from '../assets/Logo.png';
import bImg from '../assets/b.png';
import sizeChartImgThai from '../assets/Size_Chart_Thai.jpg';
import sizeChartImgEng from '../assets/Size_Chart_Eng.jpg';
import LoadingScreen from '../components/LoadingScreen';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const readOnly = location.state?.readOnly || false;
  const { registerUser, updateUser, loading, isRegistered, regData } = useRegistration();
  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');
  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };
  const t = contentLang[lang] || contentLang.TH;
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('registerFormData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved form data', e);
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
      joinActivity: '',
      pdpaConsent: false
    };
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasLoadedRegData, setHasLoadedRegData] = useState(false);

  const totalSteps = isEditMode ? 4 : 5;

  const hasChanges = React.useMemo(() => {
    if (!isEditMode || !regData) return true;
    const keysToCompare = ['titlePrefix', 'email', 'firstName', 'middleName', 'lastName', 'studentIdStatus', 'studentId', 'phone', 'nationality', 'program', 'department', 'shirtSize', 'hasDietaryRestriction', 'foodAllergyDetails', 'dietaryOther', 'hasMedicalCondition', 'medicalConditionDetails', 'joinActivity'];
    for (const key of keysToCompare) {
      if (formData[key] !== regData[key]) return true;
    }
    const formDiet = formData.dietaryRestriction || [];
    const regDiet = regData.dietaryRestriction || [];
    if (formDiet.length !== regDiet.length) return true;
    const sortedFormDiet = [...formDiet].sort();
    const sortedRegDiet = [...regDiet].sort();
    if (sortedFormDiet.some((val, i) => val !== sortedRegDiet[i])) return true;
    return false;
  }, [formData, regData, isEditMode]);

  useEffect(() => {
    // Redirect if they try to access registration when it's closed (and they aren't registered yet)
    if (!loading && !isRegistered && (isBeforeRegistration() || isAfterRegistration())) {
      navigate('/', { replace: true });
    }
  }, [loading, isRegistered, navigate]);

  useEffect(() => {
    if (isRegistered && regData && !isSuccess && !hasLoadedRegData) {
      setIsEditMode(true);
      // Migrate old program name to new program name
      const loadedData = { ...regData };
      if (loadedData.program === 'โครงการปกติ (รูปแบบการเรียนการสอนภาษาไทย)') {
        loadedData.program = 'โครงการภาษาไทย';
      }
      setFormData(prev => ({ ...prev, ...loadedData }));
      setHasLoadedRegData(true);
      setMaxStep(4); // In edit mode, all steps are accessible
      if (regData.nationality === 'ต่างชาติ') {
        setLang('EN');
      }
      if (readOnly) {
        setStep(4); // totalSteps for editMode is 4
        setMaxStep(4);
      }
    }
  }, [isRegistered, regData, isSuccess, hasLoadedRegData, readOnly]);

  useEffect(() => {
    localStorage.setItem('registerFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (error) setError('');

    if (name === 'dietaryRestriction') {
      setFormData(prev => {
        const array = Array.isArray(prev[name]) ? prev[name] : [];
        if (checked) {
          return { ...prev, [name]: [...array, value] };
        } else {
          return { ...prev, [name]: array.filter(item => item !== value) };
        }
      });
      return;
    }

    let newValue = type === 'checkbox' ? checked : value;

    // Prevent typing specific Thai vowels/tone marks as the first character globally
    if (typeof newValue === 'string' && newValue.length > 0) {
      const invalidFirstChars = /^[ุึัี้่ิืูํ๊็๋์ะา]+/;
      if (invalidFirstChars.test(newValue)) {
        newValue = newValue.replace(invalidFirstChars, '');
        if (e.target.value !== newValue) {
          e.target.value = newValue;
        }
      }
    }

    // Disallow spaces in Step 1 fields
    const step1Fields = ['firstName', 'middleName', 'lastName', 'email', 'phone', 'studentId'];
    if (step1Fields.includes(name) && typeof newValue === 'string') {
      newValue = newValue.replace(/\s/g, '');
    }

    // Filter First, Middle, Last names based on nationality
    if (['firstName', 'middleName', 'lastName'].includes(name) && typeof newValue === 'string') {
      if (formData.nationality === 'ต่างชาติ') {
        // Only allow English letters, hyphens, and apostrophes
        newValue = newValue.replace(/[^A-Za-z\-']/g, '');
        if (newValue.length > 0) {
          newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
        }
      } else if (formData.nationality === 'ไทย') {
        // Only allow Thai characters
        newValue = newValue.replace(/[^ก-๙]/g, '');
      }
      if (e.target.value !== newValue) {
        e.target.value = newValue; // Force DOM update for IME composition bypass
      }
    }

    // Only allow English, numbers, and email symbols in email
    if (name === 'email' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^a-zA-Z0-9@._-]/g, '');
      if (e.target.value !== newValue) {
        e.target.value = newValue; // Force DOM update for IME composition bypass
      }
    }

    // Only allow Arabic numbers 0-9 in phone, max 10 digits
    if (name === 'phone' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^0-9]/g, '');
      // Enforce first digit must be 0
      newValue = newValue.replace(/^[^0]+/, '');
      // Enforce second digit must not be 0
      if (newValue.length >= 2 && newValue[1] === '0') {
        newValue = newValue[0] + newValue.slice(2);
      }
      if (newValue.length > 10) {
        newValue = newValue.slice(0, 10);
      }
    }

    // Only allow numbers in studentId, max 11 digits, and enforce prefix based on nationality
    if (name === 'studentId' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^0-9]/g, '');
      const prefix = formData.nationality === 'ต่างชาติ' ? '69' : '6907050';
      if (!newValue.startsWith(prefix)) {
        if (newValue.length <= prefix.length) {
          newValue = prefix;
        } else {
          newValue = prefix + newValue.slice(prefix.length);
        }
      }
      if (newValue.length > 11) {
        newValue = newValue.slice(0, 11);
      }
    }

    // Restrict name language based on nationality and disallow any special characters/numbers
    const nameFields = ['firstName', 'middleName', 'lastName'];
    if (nameFields.includes(name) && typeof newValue === 'string') {
      if (formData.nationality === 'Thai national') {
        // Allow ONLY Thai characters (no english, no numbers, no symbols)
        newValue = newValue.replace(/[^\u0E00-\u0E7F]/g, '');
      } else if (formData.nationality === 'International student') {
        // Allow ONLY English characters (no thai, no numbers, no symbols)
        newValue = newValue.replace(/[^a-zA-Z]/g, '');
      } else {
        // If not selected yet, allow both but no symbols/numbers
        newValue = newValue.replace(/[^a-zA-Z\u0E00-\u0E7F]/g, '');
      }
    }

    let updates = { [name]: newValue };

    // Handle studentIdStatus change
    if (name === 'studentIdStatus') {
      if (newValue === 'not_received') {
        updates.studentId = '69070500000';
      } else {
        updates.studentId = '6907050';
      }
    }

    // Clear names if nationality changes to ensure language restriction consistency
    if (name === 'nationality') {
      updates = {
        ...updates,
        titlePrefix: '',
        firstName: '',
        middleName: '',
        lastName: ''
      };

      // Auto-switch language based on selected nationality
      if (newValue === 'ไทย') {
        setLang('TH');
      } else if (newValue === 'ต่างชาติ') {
        setLang('EN');
      }
    }

    // Auto-set program for specific departments
    if (name === 'department') {
      if (['วิศวกรรมเครื่องกล', 'วิศวกรรมอุตสาหการ', 'วิศวกรรมเครื่องมือและวัสดุ'].includes(newValue)) {
        updates.program = 'โครงการภาษาไทย';
      } else {
        // Clear program to force re-selection if they switch to a department that requires choice
        updates.program = '';
      }
    }

    setFormData({ ...formData, ...updates });
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.titlePrefix || !formData.email || !formData.firstName || !formData.lastName || !formData.phone || !formData.nationality || !formData.studentIdStatus) {
        setError(t.errRequired);
        return;
      }
      if (formData.studentIdStatus === 'ได้รับรหัสนักศึกษาแล้ว' && !formData.studentId) {
        setError(t.errRequired);
        return;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email) || formData.email.includes('..')) {
        setError(t.errEmailFormat);
        return;
      }
      const requiredPrefix = formData.nationality === 'ต่างชาติ' ? '69' : '6907050';
      if (formData.studentIdStatus === 'ได้รับรหัสนักศึกษาแล้ว' && (formData.studentId.length !== 11 || !formData.studentId.startsWith(requiredPrefix))) {
        setError(lang === 'TH'
          ? `กรุณากรอกรหัสนักศึกษาให้ครบ 11 หลัก (ต้องขึ้นต้นด้วย ${requiredPrefix})`
          : `Please enter an 11-digit Student ID starting with ${requiredPrefix}`);
        return;
      }
      if (formData.phone.length !== 10 || formData.phone[0] !== '0' || formData.phone[1] === '0') {
        setError(t.errPhoneFormat);
        return;
      }
    } else if (step === 2) {
      if (!formData.program || !formData.department) {
        setError(t.errRequired);
        return;
      }
    } else if (step === 3) {
      if (!formData.shirtSize || !formData.joinActivity) {
        setError(t.errRequired);
        return;
      }
      if (formData.joinActivity === 'เข้าร่วม' && (!formData.hasDietaryRestriction || !formData.hasMedicalCondition)) {
        setError(t.errRequired);
        return;
      }
      if (formData.joinActivity === 'เข้าร่วม' && formData.hasDietaryRestriction === 'มี' && (!formData.dietaryRestriction || formData.dietaryRestriction.length === 0)) {
        setError(t.errRequired);
        return;
      }
      if (formData.joinActivity === 'เข้าร่วม') {
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
      }
    } else if (step === 4 && !isEditMode) {
      if (!formData.pdpaConsent) {
        setError(lang === 'TH' ? 'กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ' : 'Please accept the terms before proceeding');
        return;
      }
    }
    setStep(prev => {
      const next = prev + 1;
      if (next > maxStep) setMaxStep(next);
      window.scrollTo(0, 0);
      return next;
    });
  };

  const handlePrev = () => {
    setError('');
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const validateAll = () => {
    setError('');
    // Step 1 Validation
    if (step === 1 || isEditMode) {
      if (!formData.nationality) {
        setError(t.errNationality);
        setStep(1);
        return false;
      }
      if (!formData.titlePrefix) {
        setError(t.errPrefix);
        setStep(1);
        return false;
      }

      const isForeigner = formData.nationality === 'ต่างชาติ';
      const isThai = formData.nationality === 'ไทย';
      const englishRegex = /^[A-Za-z\s\-']+$/;
      const thaiRegex = /^[ก-๙\s]+$/;

      if (!formData.firstName.trim()) {
        setError(t.errFirstName);
        setStep(1);
        return false;
      }
      if (isForeigner && !englishRegex.test(formData.firstName.trim())) {
        setError(lang === 'TH' ? 'กรุณากรอกชื่อเป็นภาษาอังกฤษสำหรับนักศึกษาต่างชาติ' : 'Please enter First Name in English');
        setStep(1);
        return false;
      }
      if (isThai && !thaiRegex.test(formData.firstName.trim())) {
        setError(lang === 'TH' ? 'กรุณากรอกชื่อเป็นภาษาไทยเท่านั้น' : 'Please enter First Name in Thai');
        setStep(1);
        return false;
      }

      if (formData.middleName.trim()) {
        if (isForeigner && !englishRegex.test(formData.middleName.trim())) {
          setError(lang === 'TH' ? 'กรุณากรอกชื่อกลางเป็นภาษาอังกฤษสำหรับนักศึกษาต่างชาติ' : 'Please enter Middle Name in English');
          setStep(1);
          return false;
        }
        if (isThai && !thaiRegex.test(formData.middleName.trim())) {
          setError(lang === 'TH' ? 'กรุณากรอกชื่อกลางเป็นภาษาไทยเท่านั้น' : 'Please enter Middle Name in Thai');
          setStep(1);
          return false;
        }
      }

      if (!formData.lastName.trim()) {
        setError(t.errLastName);
        setStep(1);
        return false;
      }
      if (isForeigner && !englishRegex.test(formData.lastName.trim())) {
        setError(lang === 'TH' ? 'กรุณากรอกนามสกุลเป็นภาษาอังกฤษสำหรับนักศึกษาต่างชาติ' : 'Please enter Last Name in English');
        setStep(1);
        return false;
      }
      if (isThai && !thaiRegex.test(formData.lastName.trim())) {
        setError(lang === 'TH' ? 'กรุณากรอกนามสกุลเป็นภาษาไทยเท่านั้น' : 'Please enter Last Name in Thai');
        setStep(1);
        return false;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email) || formData.email.includes('..')) {
        setError(t.errEmailFormat); setStep(1); return false;
      }
      const requiredPrefix = formData.nationality === 'ต่างชาติ' ? '69' : '6907050';
      if (formData.studentIdStatus === 'ได้รับรหัสนักศึกษาแล้ว' && (formData.studentId.length !== 11 || !formData.studentId.startsWith(requiredPrefix))) {
        setError(lang === 'TH'
          ? `กรุณากรอกรหัสนักศึกษาให้ครบ 11 หลัก (ต้องขึ้นต้นด้วย ${requiredPrefix})`
          : `Please enter an 11-digit Student ID starting with ${requiredPrefix}`);
        setStep(1); return false;
      }
      if (formData.phone.length !== 10 || formData.phone[0] !== '0' || formData.phone[1] === '0') {
        setError(t.errPhoneFormat); setStep(1); return false;
      }
    }

    // Step 2 Validation
    if (!formData.program || !formData.department) {
      setError(t.errRequired); setStep(2); return false;
    }

    // Step 3 Validation
    if (!formData.shirtSize || !formData.joinActivity) {
      setError(t.errRequired); setStep(3); return false;
    }
    if (formData.joinActivity === 'เข้าร่วม') {
      if (!formData.hasDietaryRestriction || !formData.hasMedicalCondition) {
        setError(t.errRequired); setStep(3); return false;
      }
      if (formData.hasDietaryRestriction === 'มี' && (!formData.dietaryRestriction || formData.dietaryRestriction.length === 0)) {
        setError(t.errRequired); setStep(3); return false;
      }
      if (formData.hasDietaryRestriction === 'มี') {
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('แพ้อาหารบางชนิด') && !formData.foodAllergyDetails) {
          setError(t.errAllergy); setStep(3); return false;
        }
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('อื่นๆ') && !formData.dietaryOther) {
          setError(t.errDietOther); setStep(3); return false;
        }
      }
      if (formData.hasMedicalCondition === 'มี' && !formData.medicalConditionDetails) {
        setError(t.errMedical); setStep(3); return false;
      }
    }
    return true;
  };

  const handleGoToVerify = () => {
    if (validateAll()) {
      setStep(totalSteps);
      if (totalSteps > maxStep) setMaxStep(totalSteps);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateAll()) return;

    if (!isEditMode) {
      if (!formData.pdpaConsent) {
        setError(lang === 'TH' ? 'กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ' : 'Please accept the terms before proceeding');
        return;
      }
    }
    
    setShowConfirmModal(true);
  };

  const processSubmit = async () => {
    setSubmitting(true);
    setError('');

    const currentMode = isEditMode ? 'edit' : 'register';
    const result = isEditMode ? await updateUser(formData) : await registerUser(formData);

    setSubmitting(false);

    if (result.success) {
      setFormData({
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
        dietaryRestriction: [],
        foodAllergyDetails: '',
        dietaryOther: '',
        hasMedicalCondition: '',
        medicalConditionDetails: '',
        joinActivity: '',
        pdpaConsent: false
      });
      localStorage.removeItem('registerFormData');
      setStep(1);
      setSuccessMode(currentMode);
      setIsSuccess(true);
      setShowConfirmModal(false);
      window.scrollTo(0, 0);
    } else {
      setShowConfirmModal(false);
      if (result.errorCode === 'permission_denied') {
        setError(t.errPermissionDenied);
      } else if (result.errorCode === 'register_failed') {
        setError(t.errRegister);
      } else if (result.errorCode === 'unknown_error') {
        setError(t.errUnknown + (result.errorMsg ? ` (${result.errorMsg})` : ''));
      } else {
        setError(result.error || t.errRegister);
      }
    }
  };

  const handleClearData = () => {
    if (window.confirm(t.confirmClear)) {
      setFormData(prev => {
        const newData = { ...prev };
        if (step === 1) {
          newData.titlePrefix = '';
          newData.email = '';
          newData.firstName = '';
          newData.middleName = '';
          newData.lastName = '';
          newData.studentIdStatus = '';
          newData.studentId = '';
          newData.phone = '';
          newData.nationality = '';
        } else if (step === 2) {
          newData.program = '';
          newData.department = '';
        } else if (step === 3) {
          newData.shirtSize = '';
          newData.hasDietaryRestriction = '';
          newData.dietaryRestriction = [];
          newData.foodAllergyDetails = '';
          newData.dietaryOther = '';
          newData.hasMedicalCondition = '';
          newData.medicalConditionDetails = '';
          newData.joinActivity = '';
        } else if (step === 4) {
          newData.pdpaConsent = false;
        }
        return newData;
      });
      setError('');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-magical-gold text-glow">
            {lang === 'TH' 
              ? (successMode === 'edit' ? 'แก้ไขข้อมูลสำเร็จ!' : 'ลงทะเบียนสำเร็จ!') 
              : (successMode === 'edit' ? 'Edit successful!' : 'Registration successful!')}
          </h1>
        </div>
        <div className="w-full mt-4 flex flex-col items-center">
          <button
            onClick={() => navigate('/profile')}
            className="glass-button w-full max-w-[200px] mx-auto text-[14px] py-2 flex justify-center items-center"
          >
            ดูโปรไฟล์
          </button>
        </div>
      </div>
    );
  }

  // Modern Clean Theme Classes
  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 transition-all";
  const labelClass = "block text-sm font-medium mb-2 text-gray-500";
  const radioLabelClass = "flex items-center space-x-3 cursor-pointer text-gray-600 font-medium p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors";
  const radioInputClass = "w-4 h-4 text-slate-800 focus:ring-slate-800 border-gray-300";

  const translateValue = (value) => {
    if (lang === 'TH' || !value) return value;
    const valueMap = {
      'โครงการภาษาไทย': t.regular, 'โครงการนานาชาติ': t.international,
      'โครงการปกติ (รูปแบบการเรียนการสอนภาษาไทย)': t.regular,
      'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', '2XL': '2XL', '3XL': '3XL'
    };
    const dict = {
      'ไทย': t.thaiNat, 'ต่างชาติ': t.intNat,
      'นาย': t.mr, 'นางสาว': t.ms, 'นาง': t.mrs,
      ...valueMap,
      'วิศวกรรมคอมพิวเตอร์': t.deptCPE, 'วิศวกรรมโยธา': t.deptCE, 'วิศวกรรมเคมี': t.deptChE,
      'วิศวกรรมไฟฟ้า': t.deptEE, 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม': t.deptENE, 'วิศวกรรมสิ่งแวดล้อม': t.deptENV,
      'วิศวกรรมระบบควบคุมและเครื่องมือวัด': t.deptINC, 'วิศวกรรมเครื่องกล': t.deptME, 'วิศวกรรมอุตสาหการ': t.deptPE,
      'วิศวกรรมเครื่องมือและวัสดุ': t.deptTME,
      'เข้าร่วม': t.joinYes, 'ไม่เข้าร่วม': t.joinNo,
      'ไม่มี': t.dietNo, 'มี': t.dietYes,
      'แพ้อาหารบางชนิด': t.dietAllergy, 'อิสลาม (ฮาลาล)': t.dietHalal, 'มังสวิรัติ': t.dietVeg, 'วีแกน': t.dietVegan, 'อื่นๆ': t.other
    };
    return dict[value] || value;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pb-6 overflow-x-hidden relative">
      {/* Bow Image Fixed at Top-Left */}
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" />

      {/* Top Section Wrapper to push everything up */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Logos & Header Section */}
        <div className="w-full flex justify-center lg:justify-start items-center -mt-8 -mb-5 relative z-10 min-h-[4rem] text-white">
          <div className="flex items-center z-10">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-24 sm:h-32 md:h-36 object-contain drop-shadow-lg" />
          </div>
          <div className="absolute right-0 z-20">
            <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} type="button" className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer">
              <span className="mr-1">🌐</span> <span className="w-6 text-center inline-block">{t.langBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Back Button positioned nicely above the content */}
      <div className="w-full max-w-2xl mt-8 mb-2 flex justify-start z-10 relative pl-2 sm:pl-4">
        <button
          onClick={() => {
            if (step > 1) {
              handlePrev();
            } else {
              navigate('/');
            }
          }}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 cursor-pointer drop-shadow-md"
        >
          <FaArrowLeft />
          <span>{step > 1 ? t.btnBack : (isEditMode ? t.btnBack : t.btnBackHome)}</span>
        </button>
      </div>

      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 sm:p-10 w-full max-w-2xl my-4 relative overflow-hidden text-gray-800">

        {/* Modern Stepper */}
        <div className="flex items-center justify-between mb-12 mt-6 w-full max-w-sm mx-auto relative px-2">
          {(isEditMode ? [
            { num: 1, label: t.step1 },
            { num: 2, label: t.step2 },
            { num: 3, label: t.step3 },
            { num: 4, label: t.step5 }
          ] : [
            { num: 1, label: t.step1 },
            { num: 2, label: t.step2 },
            { num: 3, label: t.step3 },
            { num: 4, label: t.step4 },
            { num: 5, label: t.step5 }
          ]).filter(s => s.num <= totalSteps).map((s, index) => (
            <React.Fragment key={s.num}>
              <div 
                className={`flex flex-col items-center relative z-10 ${s.num <= maxStep && s.num !== step ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                onClick={() => {
                  if (s.num <= maxStep && s.num !== step) {
                    setStep(s.num);
                    window.scrollTo(0, 0);
                  }
                }}
              >
                <span className={`absolute -top-6 text-[10px] sm:text-xs font-bold tracking-wider whitespace-nowrap ${s.num <= maxStep ? 'text-[#1e3a5f]' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 
                  ${s.num < maxStep ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white' : s.num === step ? 'bg-white border-[#1e3a5f] text-[#1e3a5f]' : 'bg-gray-100 border-gray-100 text-gray-400'}
                  ${s.num === step ? 'ring-4 ring-[#1e3a5f]/20' : ''}
                `}>
                  {(s.num < maxStep || (s.num === step && maxStep > step)) && <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
              </div>
              {index < totalSteps - 1 && (
                <div className={`h-1.5 sm:h-2 flex-1 -mx-0.5 z-0 transition-colors duration-500 ${(index + 1) < maxStep || (index + 1) < step ? 'bg-[#1e3a5f]' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>



        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: ข้อมูลส่วนบุคคลและติดต่อ */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.generalInfo}</h3>

              <div>
                <label className={labelClass}>{t.nationality}</label>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <label className="flex items-center gap-2 cursor-pointer w-full sm:w-1/2 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <input type="radio" name="nationality" value="ไทย" onChange={handleChange} className={radioInputClass} checked={formData.nationality === "ไทย"} />
                    <span className="text-gray-700">{t.thaiNat}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer w-full sm:w-1/2 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <input type="radio" name="nationality" value="ต่างชาติ" onChange={handleChange} className={radioInputClass} checked={formData.nationality === "ต่างชาติ"} />
                    <span className="text-gray-700">{t.intNat}</span>
                  </label>
                </div>
              </div>

              {formData.nationality && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-end">
                    <div>
                      <label className={labelClass}>{t.prefix}</label>
                      <select name="titlePrefix" value={formData.titlePrefix} onChange={handleChange} className={`${inputClass} pr-10 truncate cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_1rem_center]`}>
                        <option value="">{t.selectPrefix}</option>
                        <option value={formData.nationality === 'ต่างชาติ' ? 'Mr.' : 'นาย'}>{formData.nationality === 'ต่างชาติ' ? 'Mr.' : t.mr}</option>
                        <option value={formData.nationality === 'ต่างชาติ' ? 'Ms.' : 'นางสาว'}>{formData.nationality === 'ต่างชาติ' ? 'Ms.' : t.ms}</option>
                        <option value={formData.nationality === 'ต่างชาติ' ? 'Mrs.' : 'นาง'}>{formData.nationality === 'ต่างชาติ' ? 'Mrs.' : t.mrs}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{t.firstName}</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} placeholder={t.firstNamePlaceholder} />
                    </div>
                    <div>
                      <label className={labelClass}>{t.middleName} <span className="text-gray-400 font-normal">{t.middleNameOpt}</span></label>
                      <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={inputClass} placeholder={t.middleNamePlaceholder} />
                    </div>
                    <div>
                      <label className={labelClass}>{t.lastName}</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} placeholder={t.lastNamePlaceholder} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t.email}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder={t.emailPlaceholder} />
                  </div>

                  <div>
                    <label className={labelClass}>{t.phone}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder={t.phonePlaceholder} />
                  </div>

                  <div>
                    <label className={labelClass}>{t.studentIdStatus}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer w-full p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <input type="radio" name="studentIdStatus" value="ได้รับรหัสนักศึกษาแล้ว" onChange={handleChange} className="w-5 h-5 text-[#1e3a5f] bg-gray-100 border-gray-300 focus:ring-[#1e3a5f] focus:ring-2" checked={formData.studentIdStatus === "ได้รับรหัสนักศึกษาแล้ว"} />
                        <span className="text-gray-700">{t.studentIdReceived}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer w-full p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <input type="radio" name="studentIdStatus" value="ยังไม่ได้รับรหัสนักศึกษา" onChange={handleChange} className="w-5 h-5 text-[#1e3a5f] bg-gray-100 border-gray-300 focus:ring-[#1e3a5f] focus:ring-2" checked={formData.studentIdStatus === "ยังไม่ได้รับรหัสนักศึกษา"} />
                        <span className="text-gray-700">{t.studentIdNotReceived}</span>
                      </label>
                    </div>
                  </div>

                  {formData.studentIdStatus === 'ได้รับรหัสนักศึกษาแล้ว' && (
                    <div>
                      <label className={labelClass}>
                        {formData.nationality === 'ต่างชาติ' 
                          ? (lang === 'TH' ? 'รหัสนักศึกษา (เติมรหัส 9 ตัวท้าย) *' : 'Student ID (fill in the last 9 digits) *') 
                          : (lang === 'TH' ? 'รหัสนักศึกษา (เติมรหัส 4 ตัวท้าย) *' : 'Student ID (fill in the last 4 digits) *')}
                      </label>
                      <input 
                        type="text" 
                        name="studentId" 
                        value={formData.studentId} 
                        onChange={handleChange} 
                        onFocus={() => { 
                          if (!formData.studentId) {
                            const prefill = formData.nationality === 'ต่างชาติ' ? '69' : '6907050';
                            setFormData({ ...formData, studentId: prefill });
                          } 
                        }} 
                        className={inputClass} 
                        placeholder={formData.nationality === 'ต่างชาติ' ? '69xxxxxxxxx' : '6907050xxxx'} 
                      />
                    </div>
                  )}
                </div>
              )}


            </div>
          )}

          {/* Step 2: ข้อมูลการศึกษา */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.eduInfo}</h3>

              <div>
                <label className={labelClass}>{t.department}</label>
                <select name="department" value={formData.department} onChange={handleChange} className={`${inputClass} pr-10 truncate cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_1rem_center]`}>
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

              {formData.department && !['วิศวกรรมเครื่องกล', 'วิศวกรรมอุตสาหการ', 'วิศวกรรมเครื่องมือและวัสดุ'].includes(formData.department) && (
                <div>
                  <label className={labelClass}>{t.program}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <label className={radioLabelClass}>
                      <input type="radio" name="program" value="โครงการภาษาไทย" onChange={handleChange} className={radioInputClass} checked={formData.program === "โครงการภาษาไทย"} />
                      <span>{t.regular}</span>
                    </label>
                    <label className={radioLabelClass}>
                      <input type="radio" name="program" value="โครงการนานาชาติ" onChange={handleChange} className={radioInputClass} checked={formData.program === "โครงการนานาชาติ"} />
                      <span>{t.international}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: ข้อมูลสำหรับการจัดกิจกรรม */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.activityInfo}</h3>

              <div>
                <label className={labelClass}>{t.shirtSize}</label>
                <div className="mb-4">
                  <img src={lang === 'TH' ? sizeChartImgThai : sizeChartImgEng} alt="T-Shirt Size Chart" className="w-full max-w-md mx-auto rounded-lg shadow-sm border border-gray-100" />
                </div>
                <select name="shirtSize" value={formData.shirtSize} onChange={handleChange} className={`${inputClass} mt-1 pr-10 truncate cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[position:right_1rem_center]`}>
                  <option value="" disabled>{t.selectShirtSize}</option>
                  {[
                    { size: 'SS', chest: 36, length: 25 },
                    { size: 'S', chest: 38, length: 26 },
                    { size: 'M', chest: 40, length: 28 },
                    { size: 'L', chest: 42, length: 28 },
                    { size: 'XL', chest: 44, length: 29 },
                    { size: '2XL', chest: 46, length: 30 },
                    { size: '3XL', chest: 48, length: 30 },
                    { size: '4XL', chest: 50, length: 30 },
                    { size: '5XL', chest: 52, length: 31 },
                    { size: '6XL', chest: 54, length: 32 },
                    { size: '7XL', chest: 56, length: 33 },
                  ].map(s => (
                    <option key={s.size} value={s.size}>
                      {s.size} ({lang === 'TH' ? `รอบอก ${s.chest}" / ความยาว ${s.length}"` : `Chest ${s.chest}" / Length ${s.length}"`})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  {lang === 'TH' ? 'หากมีข้อสงสัยเพิ่มเติมสามารถติดต่อ ' : 'If you have any further questions, please contact '}
                  <a 
                    href="https://line.me/R/ti/p/@122ddost" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-gray-800 transition-colors"
                  >
                    Line OA: SMO VIDVA BANGMOD
                  </a>
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className={labelClass}>{t.join}</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className={radioLabelClass}>
                    <input type="radio" name="joinActivity" value="เข้าร่วม" onChange={handleChange} className={radioInputClass} checked={formData.joinActivity === "เข้าร่วม"} />
                    <span>{t.joinYes}</span>
                  </label>
                  <label className={radioLabelClass}>
                    <input type="radio" name="joinActivity" value="ไม่เข้าร่วม" onChange={handleChange} className={radioInputClass} checked={formData.joinActivity === "ไม่เข้าร่วม"} />
                    <span>{t.joinNo}</span>
                  </label>
                </div>
                {formData.joinActivity === 'ไม่เข้าร่วม' && (
                  <p className="mt-3 text-sm text-[#E74C3C] font-medium animate-fadeIn">
                    {t.joinNoNote}
                  </p>
                )}
              </div>

              {formData.joinActivity === 'เข้าร่วม' && (
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
                          <input type="text" name="foodAllergyDetails" value={formData.foodAllergyDetails} onChange={handleChange} className={`${inputClass} mt-3`} placeholder={t.foodAllergyPlaceholder} />
                        )}
                        {Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('อื่นๆ') && (
                          <input type="text" name="dietaryOther" value={formData.dietaryOther} onChange={handleChange} className={`${inputClass} mt-3`} placeholder={t.dietOtherPlaceholder} />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
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
                      <input type="text" name="medicalConditionDetails" value={formData.medicalConditionDetails} onChange={handleChange} className={`${inputClass} mt-3`} placeholder={t.medicalPlaceholder} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: PDPA */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.pdpaTitle}</h3>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed">
                <p className="text-gray-600 mb-2">{t.pdpaText1}</p>
              </div>

              <label className="flex items-start space-x-4 cursor-pointer mt-6 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name="pdpaConsent"
                  checked={formData.pdpaConsent}
                  onChange={handleChange}
                  disabled={readOnly}
                  className={`${radioInputClass} mt-1 rounded ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                <span className="text-sm text-gray-700">
                  {t.pdpaConsent}
                </span>
              </label>
            </div>
          )}

          {/* Step 5: Verification Phase */}
          {((step === 5 && !isEditMode) || (step === 4 && isEditMode)) && (
            <div className="space-y-8 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-6">{readOnly ? (lang === 'TH' ? 'ข้อมูลส่วนตัว' : 'Personal Information') : t.verifyTitle}</h3>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-8 space-y-4 sm:space-y-8 text-gray-700">

                {/* General Info */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{t.generalInfo}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(1); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.nationality.replace(' *', '')}</span><p className="font-medium text-gray-800">{translateValue(formData.nationality)}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{lang === 'TH' ? 'ชื่อ-นามสกุล' : 'Full Name'}</span><p className="font-medium text-gray-800">{`${translateValue(formData.titlePrefix)} ${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`}</p></div>
                    <div><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.email.replace(' *', '')}</span><p className="font-medium text-gray-800 break-all">{formData.email}</p></div>
                    <div><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.phone.replace(' *', '')}</span><p className="font-medium text-gray-800">{formData.phone}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">
                      {formData.nationality === 'ต่างชาติ' 
                        ? (lang === 'TH' ? 'รหัสนักศึกษา' : 'Student ID') 
                        : (lang === 'TH' ? 'รหัสนักศึกษา' : 'Student ID')}
                    </span><p className="font-medium text-gray-800">{formData.studentIdStatus === 'ยังไม่ได้รับรหัสนักศึกษา' ? (lang === 'TH' ? 'ยังไม่ได้รับรหัสนักศึกษา' : 'Not yet received Student ID') : formData.studentId}</p></div>
                  </div>
                </div>

                {/* Education Info */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{t.eduInfo}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(2); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 gap-y-5 text-sm">
                    <div><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.program.replace(' *', '')}</span><p className="font-medium text-gray-800">{translateValue(formData.program)}</p></div>
                    <div><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.department.replace(' *', '')}</span><p className="font-medium text-gray-800">{translateValue(formData.department)}</p></div>
                  </div>
                </div>

                {/* Activity Info */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{t.activityInfo}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(3); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.shirtSize.replace(' *', '')}</span><p className="font-medium text-gray-800">{formData.shirtSize}</p></div>
                    <div><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.join.replace(' *', '')}</span><p className="font-medium text-gray-800">{translateValue(formData.joinActivity)}</p></div>
                    {formData.joinActivity === 'เข้าร่วม' && (
                      <>
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.diet.replace(' *', '')}</span>
                          <p className="font-medium text-gray-800 leading-relaxed">
                            {formData.hasDietaryRestriction === 'ไม่มี' ? t.dietNo : (
                              Array.isArray(formData.dietaryRestriction) ? formData.dietaryRestriction.map(d =>
                                d === 'แพ้อาหารบางชนิด' ? (lang === 'TH' ? `แพ้อาหาร: ${formData.foodAllergyDetails}` : `Allergy: ${formData.foodAllergyDetails}`) :
                                  d === 'อื่นๆ' ? (lang === 'TH' ? `อื่นๆ: ${formData.dietaryOther}` : `Other: ${formData.dietaryOther}`) : translateValue(d)
                              ).join(', ') : ''
                            )}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">{t.medical.replace(' *', '')}</span>
                          <p className="font-medium text-gray-800">{formData.hasMedicalCondition === 'ไม่มี' ? t.medicalNo : formData.medicalConditionDetails}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mt-6 mb-2 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 sm:gap-0 mt-8 pt-6 sm:mt-12 sm:pt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (readOnly) navigate('/profile');
                  else handlePrev();
                }}
                className="text-gray-500 hover:text-gray-800 font-medium px-4 py-3 sm:py-2 transition-colors text-sm w-full sm:w-auto border border-gray-200 sm:border-none rounded-xl sm:rounded-none"
              >{readOnly ? (lang === 'TH' ? 'ย้อนกลับ' : 'Back') : t.btnBack}</button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.scrollTo(0, 0);
                  if (isEditMode) {
                    navigate('/profile');
                  } else {
                    navigate('/');
                  }
                }}
                className="text-gray-500 hover:text-gray-800 font-medium px-4 py-3 sm:py-2 transition-colors text-sm w-full sm:w-auto border border-gray-200 sm:border-none rounded-xl sm:rounded-none"
              >{isEditMode ? (lang === 'TH' ? 'ย้อนกลับ' : 'Back') : t.btnBackHome}</button>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto">
              {step !== 5 && !isEditMode && (
                <button onClick={handleClearData} type="button" className="text-gray-400 hover:text-red-500 text-sm transition-colors cursor-pointer underline underline-offset-2 order-2 sm:order-1 mt-2 sm:mt-0 pb-2 sm:pb-0">
                  {t.btnClear}
                </button>
              )}

              {isEditMode && step < totalSteps && !readOnly && (
                <button
                  type="button"
                  disabled={submitting || !hasChanges}
                  onClick={handleGoToVerify}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all shadow-md text-sm sm:text-base order-1 sm:order-2 ${!hasChanges ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg cursor-pointer"}`}
                >
                  {t.btnEditSubmit}
                </button>
              )}

              {step < totalSteps && !readOnly && (
                <button
                  key="btn-next"
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152b47] text-white px-8 sm:px-12 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base order-1 sm:order-2"
                >{t.btnNext}</button>
              )}

              {step === totalSteps && !readOnly && (
                <button
                  key="btn-submit"
                  type="submit"
                  disabled={submitting || (isEditMode && !hasChanges)}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm sm:text-base order-1 sm:order-2 ${isEditMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#1e3a5f] hover:bg-[#152b47] text-white"}`}
                >
                  {submitting ? t.btnSubmitting : (isEditMode ? (lang === 'TH' ? 'ยืนยันการแก้ไขข้อมูล' : 'Confirm Edits') : t.btnSubmit)}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      {/* Custom Confirm Modal */}
      {showConfirmModal && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => !submitting && setShowConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-[#1e3a5f] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {lang === 'TH' ? (isEditMode ? 'ยืนยันการแก้ไขข้อมูล' : 'ยืนยันการลงทะเบียน') : (isEditMode ? 'Confirm changes' : 'Confirm registration')}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {lang === 'TH' ? (isEditMode ? 'คุณต้องการยืนยันการแก้ไขข้อมูลใช่หรือไม่?' : 'คุณต้องการยืนยันการลงทะเบียนใช่หรือไม่?') : (isEditMode ? 'Are you sure you want to save these changes?' : 'Are you sure you want to submit this registration?')}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-gray-600 font-medium transition-colors ${submitting ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {lang === 'TH' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button 
                  onClick={processSubmit}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-colors shadow-sm ${submitting ? 'bg-[#1e3a5f] opacity-75 cursor-not-allowed flex justify-center items-center' : 'bg-[#1e3a5f] hover:bg-[#152c4a]'}`}
                >
                  {submitting ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    lang === 'TH' ? 'ตกลง' : 'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Register;
