import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { isBeforeStaffRegistration, isAfterStaffRegistration } from '../config/timeConfig';
import { useStaffRegistration } from '../contexts/StaffRegContext';

const contentLang = {
  TH: {
    langBtn: 'TH',
    step1: 'ข้อมูล',
    step2: 'ติดต่อ',
    step3: 'ตำแหน่ง',
    step4: 'สุขภาพ',
    step5: 'ยินยอม',
    step6: 'ตรวจสอบ',
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
    middleNamePlaceholder: 'ชื่อกลาง',
    lastName: 'นามสกุล *',
    lastNamePlaceholder: 'นามสกุล',
    email: 'อีเมล *',
    emailPlaceholder: 'example@gmail.com',
    phone: 'เบอร์โทรศัพท์ *',
    phonePlaceholder: 'กรอกเบอร์โทรศัพท์ของคุณ',
    studentIdStatus: 'สถานะรหัสนักศึกษา *',
    studentIdReceived: 'ได้รับรหัสนักศึกษาแล้ว',
    studentIdNotReceived: 'ยังไม่ได้รับรหัสนักศึกษา',
    studentId: 'รหัสนักศึกษา *',
    studentIdPlaceholder: 'รหัสนักศึกษา 11 หลัก',
    eduInfo: 'ข้อมูลการศึกษา',
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
    pdpaTextStaff: 'ข้อมูลส่วนบุคคลที่กรอกในแบบฟอร์มนี้ จะถูกนำไปใช้เพื่อวัตถุประสงค์ในการคัดเลือกและบริหารจัดการทีมงาน (Staff) สำหรับโครงการปฐมนิเทศนักศึกษาใหม่ คณะวิศวกรรมศาสตร์ ปีการศึกษา 2569 เท่านั้น',
    pdpaConsentStaff: 'ข้าพเจ้ายินยอมให้มีการเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลเพื่อการคัดเลือก Staff *',
    btnBackHome: 'ย้อนกลับไปหน้าหลัก',
    btnBack: 'ย้อนกลับ',
    btnNext: 'ถัดไป',
    btnSubmit: 'ยืนยันส่งใบสมัคร',
    btnEditSubmit: 'บันทึกการแก้ไขใบสมัคร',
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
    step1: 'Info',
    step2: 'Contact',
    step3: 'Roles',
    step4: 'Health',
    step5: 'Consent',
    step6: 'Verify',
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
    middleNamePlaceholder: 'Middle Name',
    lastName: 'Last Name *',
    lastNamePlaceholder: 'Last Name',
    email: 'Email *',
    emailPlaceholder: 'example@gmail.com',
    phone: 'Phone number *',
    phonePlaceholder: 'Enter your phone number',
    studentId: 'Student ID *',
    studentIdPlaceholder: '11-digit Student ID',
    eduInfo: 'Education Information',
    regular: 'Thai Program',
    international: 'International Program',
    department: 'Department *',
    selectDept: '-- Please select department --',
    deptCPE: 'Computer Engineering',
    deptCE: 'Civil Engineering',
    deptChE: 'Chemical Engineering',
    deptEE: 'Electrical Engineering',
    deptENE: 'Electronics and Telecommunication Engineering',
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
    pdpaTextStaff: 'The personal information provided in this form will be used solely for the purpose of selecting and managing staff for the Faculty of Engineering Orientation Program, Academic Year 2026.',
    pdpaConsentStaff: 'I consent to the collection and use of my personal data for staff recruitment *',
    btnBackHome: 'Back to Home',
    btnBack: 'Back',
    btnNext: 'Next',
    btnSubmit: 'Confirm Application',
    btnEditSubmit: 'Save Application Changes',
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

import { FaCheck, FaArrowLeft, FaLine, FaHeartbeat, FaRunning, FaTools, FaCamera } from 'react-icons/fa';
import logoImg from '../assets/Logo.png';
import bImg from '../assets/b.png';
import sizeChartImgThai from '../assets/Size_Chart_Thai.jpg';
import sizeChartImgEng from '../assets/Size_Chart_Eng.jpg';
import LoadingScreen from '../components/LoadingScreen';
import { isStaffEditClosed } from '../config/timeConfig';

const StaffRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerUser, updateUser, loading, isRegistered, regData } = useStaffRegistration();
  
  const isPastDeadline = isRegistered ? isStaffEditClosed() : isAfterStaffRegistration();
  const readOnly = location.state?.readOnly || isPastDeadline || (regData?.editCount >= 2);
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
      nickname: '',
      studentIdStatus: '',
      studentId: '',
      phone: '',
      lineId: '',
      nationality: '',
      year: '',
      department: '',
      role1: '',
      role2: '',
      hasDietaryRestriction: '',
      dietaryRestriction: [],
      foodAllergyDetails: '',
      dietaryOther: '',
      hasMedicalCondition: '',
      medicalConditionDetails: '',
      joinActivity: '',
      pdpaConsent: false,
      note: null
    };
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [maxStep, setMaxStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [hasLoadedRegData, setHasLoadedRegData] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const isFieldLocked = () => {
    return false;
  };
  const totalSteps = isEditMode ? 5 : 6;

  const hasChanges = React.useMemo(() => {
    if (!isEditMode || !regData) return true;
    const keysToCompare = ['titlePrefix', 'email', 'firstName', 'middleName', 'lastName', 'nickname', 'studentIdStatus', 'studentId', 'phone', 'lineId', 'nationality', 'year', 'department', 'role1', 'role2', 'hasDietaryRestriction', 'foodAllergyDetails', 'dietaryOther', 'hasMedicalCondition', 'medicalConditionDetails', 'joinActivity'];
    for (const key of keysToCompare) {
      let formVal = formData[key];
      if (typeof formVal === 'string') formVal = formVal.trim();

      let regVal = regData[key];

      formVal = formVal === undefined || formVal === null ? '' : formVal;
      regVal = regVal === undefined || regVal === null ? '' : regVal;

      if (formVal !== regVal) return true;
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
    if (!loading && !isRegistered && (isBeforeStaffRegistration() || isAfterStaffRegistration())) {
      navigate('/staff', { replace: true });
    }
  }, [loading, isRegistered, navigate]);

  useEffect(() => {
    if (isRegistered && regData && !isSuccess && !hasLoadedRegData) {
      setIsEditMode(true);
      setFormData(prev => ({ ...prev, ...regData }));
      setHasLoadedRegData(true);
      setMaxStep(4); // In edit mode, all steps are accessible
      if (regData.nationality === 'ต่างชาติ') {
        setLang('EN');
      }
      if (readOnly) {
        setStep(5); // totalSteps for editMode is 5
        setMaxStep(5);
      }
    }
  }, [isRegistered, regData, isSuccess, hasLoadedRegData, readOnly]);

  useEffect(() => {
    localStorage.setItem('registerFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (showConfirmModal || showDiscardModal || showClearModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal, showDiscardModal, showClearModal]);

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
      const invalidFirstChars = /^[ุึัี้่ิืูํ๊็๋์ะาำ]+/;
      if (invalidFirstChars.test(newValue)) {
        newValue = newValue.replace(invalidFirstChars, '');
      }

      // Aggressive replacement for double Sra E (เเ) -> Sra Ae (แ)
      // Try both Unicode and literal string replacements to bypass any browser parsing quirks
      newValue = newValue.replace(/\u0E40{2,}/g, '\u0E41');
      newValue = newValue.replace(/เเ/g, 'แ');
      while (newValue.indexOf('เเ') !== -1) {
        newValue = newValue.replace('เเ', 'แ');
      }

      if (e.target.value !== newValue) {
        e.target.value = newValue;
      }
    }

    // Disallow spaces in specific Step 1 fields (except names)
    const noSpaceFields = ['email', 'phone', 'studentId'];
    if (noSpaceFields.includes(name) && typeof newValue === 'string') {
      newValue = newValue.replace(/\s/g, '');
    }

    // Filter First, Middle, Last names based on nationality
    if (['firstName', 'middleName', 'lastName', 'nickname'].includes(name) && typeof newValue === 'string') {
      if (formData.nationality === 'ต่างชาติ') {
        // Only allow English letters, spaces, hyphens, and apostrophes
        newValue = newValue.replace(/[^A-Za-z\s\-']/g, '');
        if (newValue.length > 0) {
          newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
        }
      } else if (formData.nationality === 'ไทย') {
        // Only allow Thai characters and spaces
        newValue = newValue.replace(/[^ก-๙\s]/g, '');
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

    // Only allow numbers in studentId, max 11 digits, and must start with 6
    if (name === 'studentId' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^0-9]/g, '');
      if (newValue.length > 0 && newValue[0] !== '6') {
        newValue = '6' + newValue.replace(/^[^6]+/, '');
      }
      if (newValue.length > 11) {
        newValue = newValue.slice(0, 11);
      }
    }

    // Restrict name language based on nationality and disallow any special characters/numbers
    const nameFields = ['firstName', 'middleName', 'lastName'];
    if (nameFields.includes(name) && typeof newValue === 'string') {
      if (formData.nationality === 'Thai national') {
        // Allow ONLY Thai characters and spaces (no english, no numbers, no symbols)
        newValue = newValue.replace(/[^\u0E00-\u0E7F\s]/g, '');
      } else if (formData.nationality === 'International student') {
        // Allow ONLY English characters and spaces (no thai, no numbers, no symbols)
        newValue = newValue.replace(/[^a-zA-Z\s]/g, '');
      } else {
        // If not selected yet, allow both and spaces but no symbols/numbers
        newValue = newValue.replace(/[^a-zA-Z\u0E00-\u0E7F\s]/g, '');
      }
    }

    
    // Custom logic for Nickname and Line ID
    if (name === 'nickname' && typeof newValue === 'string') {
      if (formData.nationality === 'ไทย') {
        newValue = newValue.replace(/[^ก-๙a-zA-Z\s]/g, '');
      } else {
        newValue = newValue.replace(/[^a-zA-Z\s]/g, '');
      }
    }
    if (name === 'lineId' && typeof newValue === 'string') {
      newValue = newValue.replace(/[^a-zA-Z0-9.\-_~]/g, '');
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
  

    if (name === 'studentIdStatus') {
      if (newValue === 'ยังไม่ได้รับรหัสนักศึกษา') {
        // ให้บันทึก 69070500000 หมดเลยตามที่ตกลงกันไว้
        updates.studentId = '69070500000';
      } else {
        // กรณีได้รับรหัสแล้ว คืนค่า prefix ให้ถูกต้องตามสัญชาติ
        const isForeigner = formData.nationality === 'ต่างชาติ';
        updates.studentId = isForeigner ? '69' : '6907050';
      }
    }

    // Auto-clear dietary fields when 'ไม่มี' is selected
    if (name === 'hasDietaryRestriction' && newValue === 'ไม่มี') {
      updates.dietaryRestriction = [];
      updates.foodAllergyDetails = '';
      updates.dietaryOther = '';
    }

    // Auto-clear medical fields when 'ไม่มี' is selected
    if (name === 'hasMedicalCondition' && newValue === 'ไม่มี') {
      updates.medicalConditionDetails = '';
    }

    // Clear names if nationality changes to ensure language restriction consistency
    if (name === 'nationality') {
      updates = {
        ...updates,
        titlePrefix: '',
        nickname: '',
        year: '',
        lineId: '',
        role1: '',
        role2: '',
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



    setFormData({ ...formData, ...updates });
  };

  const handleNext = () => {
    setError('');
    const isValid = (() => {
    if (step === 1) {
      if (!formData.titlePrefix || !formData.firstName.trim() || !formData.lastName.trim() || !formData.nationality || !formData.nickname.trim() || !formData.year || !formData.department) {
        setError(t.errRequired); return false;
      }
      const idPrefix = formData.studentId.slice(0, 2);
      if (formData.studentId.length !== 11 || !['66', '67', '68'].includes(idPrefix)) {
        setError(lang === 'TH' 
          ? 'สมัครได้เฉพาะรหัสนักศึกษาที่ขึ้นต้นด้วย 66, 67, 68 เท่านั้น' 
          : 'Only student IDs starting with 66, 67, 68 are allowed to register');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.lineId.trim() || !formData.phone || !formData.email) {
        setError(t.errRequired); return false;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
    } return true;})();
    if (!isValid) {
      return;
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

  const handleBackNavigation = () => {
    if (isEditMode) {
      if (hasChanges && !readOnly) {
        setShowDiscardModal(true);
        return;
      }
      navigate('/staff/profile');
    } else if (step > 1) {
      handlePrev();
    } else {
      navigate('/staff');
    }
  };

  const validateAll = () => {
    setError('');
    let step = 1;
    
    if (step === 1) {
      if (!formData.titlePrefix || !formData.firstName.trim() || !formData.lastName.trim() || !formData.nationality || !formData.nickname.trim() || !formData.year || !formData.department) {
        setError(t.errRequired); setStep(step); return false;
      }
      const idPrefix = formData.studentId.slice(0, 2);
      if (formData.studentId.length !== 11 || !['66', '67', '68'].includes(idPrefix)) {
        setError(lang === 'TH' 
          ? 'สมัครได้เฉพาะรหัสนักศึกษาที่ขึ้นต้นด้วย 66, 67, 68 เท่านั้น' 
          : 'Only student IDs starting with 66, 67, 68 are allowed to register');
        setStep(step); return false;
      }
    }
    if (step === 2) {
      if (!formData.lineId.trim() || !formData.phone || !formData.email) {
        setError(t.errRequired); setStep(step); return false;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email) || formData.email.includes('..')) {
        setError(t.errEmailFormat); setStep(step); return false;
      }
      if (formData.phone.length !== 10 || formData.phone[0] !== '0' || formData.phone[1] === '0') {
        setError(t.errPhoneFormat); setStep(step); return false;
      }
    }
    if (step === 3) {
      if (!formData.role1 || !formData.role2 || formData.role1 === formData.role2) {
        setError(t.errRequired); setStep(step); return false;
      }
    }
    if (step === 4) {
      if (!formData.hasDietaryRestriction || !formData.hasMedicalCondition) {
        setError(t.errRequired); setStep(step); return false;
      }
      if (formData.hasDietaryRestriction === 'มี' && (!formData.dietaryRestriction || formData.dietaryRestriction.length === 0)) {
        setError(t.errRequired); setStep(step); return false;
      }
      if (formData.hasDietaryRestriction === 'มี') {
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('แพ้อาหารบางชนิด') && !formData.foodAllergyDetails) {
          setError(t.errAllergy); setStep(step); return false;
        }
        if (Array.isArray(formData.dietaryRestriction) && formData.dietaryRestriction.includes('อื่นๆ') && !formData.dietaryOther) {
          setError(t.errDietOther); setStep(step); return false;
        }
      }
      if (formData.hasMedicalCondition === 'มี' && !formData.medicalConditionDetails) {
        setError(t.errMedical); setStep(step); return false;
      }
    }
    if (step === 5 && !isEditMode) {
      if (!formData.pdpaConsent) {
        setError(lang === 'TH' ? 'กรุณายอมรับเงื่อนไขก่อนดำเนินการต่อ' : 'Please accept the terms before proceeding');
        setStep(step); return false;
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

    // Trim spaces before uploading to Database
    const trimmedData = {
      ...formData,
      firstName: formData.firstName.trim(),
      middleName: formData.middleName.trim(),
      lastName: formData.lastName.trim(),
      nickname: formData.nickname ? formData.nickname.trim() : '',
      lineId: formData.lineId ? formData.lineId.trim() : '',
    };

    // Clean up dirty data for dietary and medical conditions before saving
    if (trimmedData.hasDietaryRestriction === 'ไม่มี') {
      trimmedData.dietaryRestriction = [];
      trimmedData.foodAllergyDetails = '';
      trimmedData.dietaryOther = '';
    }

    if (trimmedData.hasMedicalCondition === 'ไม่มี') {
      trimmedData.medicalConditionDetails = '';
    }

    if (isEditMode && regData) {
      const checkKeys = ['titlePrefix', 'firstName', 'middleName', 'lastName', 'nickname', 'email', 'phone', 'lineId', 'studentIdStatus', 'studentId', 'nationality', 'year', 'department', 'role1', 'role2', 'hasDietaryRestriction', 'foodAllergyDetails', 'dietaryOther', 'hasMedicalCondition', 'medicalConditionDetails', 'joinActivity'];
      let isChanged = false;
      for (const key of checkKeys) {
        let oldVal = regData[key];
        oldVal = oldVal === undefined || oldVal === null ? '' : oldVal;

        let newVal = trimmedData[key];
        newVal = newVal === undefined || newVal === null ? '' : newVal;

        if (oldVal !== newVal) {
          console.log("Field changed:", key, "from", oldVal, "to", newVal);
          isChanged = true; break;
        }
      }

      const formDiet = trimmedData.dietaryRestriction || [];
      const regDiet = regData.dietaryRestriction || [];
      if (formDiet.length !== regDiet.length) isChanged = true;
      else {
        const sortedFormDiet = [...formDiet].sort();
        const sortedRegDiet = [...regDiet].sort();
        if (sortedFormDiet.some((val, i) => val !== sortedRegDiet[i])) isChanged = true;
      }

      if (!isChanged) {
        setSubmitting(false);
        setShowConfirmModal(false);
        setError(lang === 'TH' ? 'ไม่พบการเปลี่ยนแปลงข้อมูล (หรือมีการพิมพ์แค่ช่องว่าง)' : 'No changes detected (or only spaces were added).');
        return;
      }
    }

    const currentMode = isEditMode ? 'edit' : 'register';
    const result = isEditMode ? await updateUser(trimmedData) : await registerUser(trimmedData, "staff_applicants", "staff_applicants");

    setSubmitting(false);

    if (result.success) {
      setFormData({
        titlePrefix: '',
        email: '',
        firstName: '',
        middleName: '',
        lastName: '',
        nickname: '',
        studentIdStatus: '',
        studentId: '',
        phone: '',
        lineId: '',
        nationality: '',
        year: '',
        department: '',
        role1: '',
        role2: '',
        hasDietaryRestriction: '',
        dietaryRestriction: [],
        foodAllergyDetails: '',
        dietaryOther: '',
        hasMedicalCondition: '',
        medicalConditionDetails: '',
        joinActivity: '',
        pdpaConsent: false,
        note: null
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

  const triggerClearData = () => {
    setShowClearModal(true);
  };

  const handleClearData = () => {
    setFormData(prev => {
      const newData = { ...prev };
      if (step === 1) {
        newData.titlePrefix = '';
        newData.firstName = '';
        newData.middleName = '';
        newData.lastName = '';
        newData.nationality = '';
        newData.nickname = '';
        newData.year = '';
        newData.department = '';
        newData.studentIdStatus = '';
        newData.studentId = '';
      } else if (step === 2) {
        newData.lineId = '';
        newData.phone = '';
        newData.email = '';
      } else if (step === 3) {
        newData.role1 = '';
        newData.role2 = '';
      } else if (step === 4) {
        newData.hasDietaryRestriction = '';
        newData.dietaryRestriction = [];
        newData.foodAllergyDetails = '';
        newData.dietaryOther = '';
        newData.hasMedicalCondition = '';
        newData.medicalConditionDetails = '';
        newData.joinActivity = '';
      } else if (step === 5) {
        newData.pdpaConsent = false;
      }
      return newData;
    });
    setError('');
    setShowClearModal(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (isSuccess) {
    const isEdit = successMode === 'edit';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] text-center flex flex-col items-center">
          {isEdit ? (
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          
          <h1 className={`text-2xl font-bold text-glow mb-4 leading-tight ${isEdit ? 'text-magical-gold' : 'text-yellow-400'}`}>
            {lang === 'TH'
              ? (isEdit ? 'แก้ไขใบสมัคร Staff สำเร็จ!' : '⚠️ ขั้นตอนสำคัญสุดท้าย!')
              : (isEdit ? 'Staff Application Updated!' : '⚠️ Crucial Last Step!')}
          </h1>

          <p className="text-sm text-white/90 leading-relaxed mb-8 max-w-xs font-medium">
            {lang === 'TH' ? (
              isEdit ? (
                'ระบบได้บันทึกข้อมูลการแก้ไขใบสมัครเรียบร้อยแล้ว'
              ) : (
                <>
                  โปรดกดปุ่มด้านล่างเพื่อไปยังหน้า <span className="text-yellow-300 font-extrabold underline underline-offset-2">"โปรไฟล์ Staff ของฉัน"</span> และกดเข้าร่วมกลุ่ม <span className="text-emerald-400 font-extrabold underline underline-offset-2">"LINE Staff"</span> เพื่อเป็นการ <span className="text-yellow-300 font-extrabold">ยืนยันการสมัครในขั้นตอนสุดท้าย</span>
                </>
              )
            ) : (
              isEdit ? (
                'Your changes have been saved successfully.'
              ) : (
                <>
                  Please press the button below to go to your <span className="text-yellow-300 font-extrabold underline underline-offset-2">"Staff Profile"</span>, and join the <span className="text-emerald-400 font-extrabold underline underline-offset-2">"LINE Staff Group"</span> to <span className="text-yellow-300 font-extrabold">confirm your application in the final step</span>.
                </>
              )
            )}
          </p>

          <button
            onClick={() => navigate('/staff/profile')}
            className="glass-button w-full max-w-[240px] text-[14px] py-3 flex justify-center items-center font-bold tracking-wide cursor-pointer"
          >
            {lang === 'TH' ? 'ไปที่โปรไฟล์ Staff ของฉัน' : 'Go to My Staff Profile'}
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
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Logos & Header Section */}
        <div className="w-full flex justify-center lg:justify-start items-center -mt-8 -mb-5 relative z-10 min-h-[4rem] text-white">
          <div className="flex items-center z-10">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-24 sm:h-32 md:h-36 object-contain drop-shadow-lg" />
          </div>
          <div className="absolute right-0 z-20">
            <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} type="button" className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer">
              <span className="mr-1">🌍</span> <span className="w-6 text-center inline-block">{t.langBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Back Button positioned nicely above the content */}
      <div className="w-full max-w-lg mt-8 mb-2 flex justify-start z-10 relative pl-2 sm:pl-4">
        <button
          onClick={handleBackNavigation}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 cursor-pointer drop-shadow-md"
        >
          <FaArrowLeft />
          <span>{isEditMode ? (lang === 'TH' ? 'ย้อนกลับไปโปรไฟล์ของฉัน' : 'Back to My Profile') : (lang === 'TH' ? 'ย้อนกลับ' : 'Back')}</span>
        </button>
      </div>

      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 sm:p-10 w-full max-w-lg my-4 relative overflow-hidden text-gray-800">

        {/* Modern Stepper */}
        {!readOnly && (
          <div className="flex items-center justify-between mb-12 mt-6 w-full max-w-sm mx-auto relative px-2">
            {(isEditMode ? [
              { num: 1, label: t.step1 },
              { num: 2, label: t.step2 },
              { num: 3, label: t.step3 },
              { num: 4, label: t.step4 },
              { num: 5, label: t.step6 }
            ] : [
              { num: 1, label: t.step1 },
              { num: 2, label: t.step2 },
              { num: 3, label: t.step3 },
              { num: 4, label: t.step4 },
              { num: 5, label: t.step5 },
              { num: 6, label: t.step6 }
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
        )}



        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: ข้อมูลส่วนบุคคล */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.personalInfo}</h3>
              
              <div className="border-b border-gray-100 pb-6 mb-6">
                <label className={labelClass}>{t.nationality}</label>
                <div onClickCapture={(e) => { if (isFieldLocked('nationality')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <label className={`${radioLabelClass} ${isFieldLocked('nationality') ? 'opacity-60 !bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input type="radio" name="nationality" value="ไทย" onChange={handleChange} className={radioInputClass} checked={formData.nationality === "ไทย"} />
                      <span>{t.thaiNat}</span>
                    </label>
                    <label className={`${radioLabelClass} ${isFieldLocked('nationality') ? 'opacity-60 !bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`}>
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
                        <select name="titlePrefix" value={formData.titlePrefix} onChange={handleChange} className={`${inputClass} ${isFieldLocked('titlePrefix') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`}>
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
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`${inputClass} ${isFieldLocked('firstName') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`} placeholder={t.firstNamePlaceholder} />
                        </div>
                      </div>
                      
                      <div>
                        <label className={labelClass}>{t.lastName}</label>
                        <div onClickCapture={(e) => { if (isFieldLocked('lastName')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`${inputClass} ${isFieldLocked('lastName') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`} placeholder={t.lastNamePlaceholder} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t.middleName} <span className="text-gray-400 font-normal">{t.middleNameOpt}</span></label>
                    <div onClickCapture={(e) => { if (isFieldLocked('middleName')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                      <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={`${inputClass} ${isFieldLocked('middleName') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`} placeholder={t.middleNamePlaceholder} />
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
                      <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} className={`${inputClass} ${isFieldLocked('studentId') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`} placeholder={lang === 'TH' ? 'รหัสนักศึกษา 11 หลัก (ขึ้นต้นด้วย 66, 67, 68)' : '11-digit Student ID (starts with 66, 67, 68)'} />
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass}>{t.department}</label>
                    <div onClickCapture={(e) => { if (isFieldLocked('department')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                      <select name="department" value={formData.department} onChange={handleChange} className={`${inputClass} ${isFieldLocked('department') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`}>
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
                      <option value="2">ปี 2</option>
                      <option value="3">ปี 3</option>
                      <option value="4">ปี 4</option>
                    </select>
                  </div>

                </div>
              )}
            </div>
          )}
  {/* Step 2: ข้อมูลการติดต่อ */}
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
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} ${isFieldLocked('phone') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`} placeholder={t.phonePlaceholder} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t.email}</label>
                <div onClickCapture={(e) => { if (isFieldLocked('email')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClass} ${isFieldLocked('email') ? '!bg-gray-100 !text-gray-500 cursor-not-allowed pointer-events-none' : ''}`} placeholder={t.emailPlaceholder} />
                </div>
              </div>
            </div>
          )}
  {/* Step 3: ตำแหน่งที่สมัคร */}
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
                      <li><strong>หน้าที่:</strong> ช่วยเคลื่อนย้าย จัดวางอุปกรณ์ต่าง ๆ, แจกอาหารว่างและเครื่องดื่ม, หน้าที่อื่น ๆ ที่ได้รับมอบหมาย</li>
                      <li className="text-orange-500"><strong>หมายเหตุ:</strong> มีการนัดหมายจัดสถานที่ วันที่ 24 กรกฎาคม 2569</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                    <h5 className="font-bold text-[#1e3a5f] mb-1 flex items-center"><FaCamera className="mr-2 text-blue-500"/> ประชาสัมพันธ์ (3 คน)</h5>
                    <ul className="text-[13px] text-gray-600 space-y-1">
                      <li><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</li>
                      <li><strong>หน้าที่:</strong> เก็บบรรยากาศภายในกิจกรรม, จัดทำคลิป และเนื้อหาประชาสัมพันธ์ เผยแพร่ผ่านช่องทางออนไลน์, หน้าที่อื่น ๆ ที่ได้รับมอบหมาย</li>
                      <li className="text-orange-500"><strong>หมายเหตุ:</strong> อาจมีการนัดหมายเพิ่มเติม</li>
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
  {/* Step 4: สุขภาพและสวัสดิการ */}
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
  {/* Step 5: การยินยอม */}
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
                  className={`${radioInputClass} mt-1 rounded ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                <span className="text-sm text-gray-700">
                  {t.pdpaConsentStaff}
                </span>
              </label>
            </div>
          )}
  
{/* Step 6: Verification Phase */}
          {((step === 6 && !isEditMode) || (step === 5 && isEditMode)) && (
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
                    {!readOnly && <button type="button" onClick={() => { setStep(4); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">ตำแหน่งที่สมัคร (อันดับ 1)</span><p className="font-medium text-gray-800">{formData.role1}</p></div>
                    <div className="sm:col-span-2"><span className="text-gray-400 block mb-1.5 text-xs uppercase tracking-wider">ตำแหน่งที่สมัคร (อันดับ 2)</span><p className="font-medium text-gray-800">{formData.role2}</p></div>
                  </div>
                </div>

                {/* Activity Info */}
                <div className="bg-slate-50/70 rounded-xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                    <h4 className="text-lg font-bold text-[#1e3a5f]">{t.activityInfo}</h4>
                    {!readOnly && <button type="button" onClick={() => { setStep(3); window.scrollTo(0, 0); }} className="text-sm bg-white hover:bg-slate-100 border border-slate-200 text-[#1e3a5f] px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">{t.editDataBtn}</button>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                    {1 === 1 && (
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

          {/* Step 4: PDPA (Bottom of Verification) */}
          {((step === 6 && !isEditMode) || (step === 5 && isEditMode)) && (
            <div className="space-y-6 animate-fadeIn mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl sm:text-2xl font-medium text-center text-gray-800 mb-8">{t.pdpaTitle}</h3>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed">
                <p className="text-gray-600 mb-2">{t.pdpaTextStaff}</p>
              </div>

              <label className="flex items-start space-x-4 mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50 opacity-80">
                <input
                  type="checkbox"
                  name="pdpaConsent"
                  checked={formData.pdpaConsent}
                  readOnly
                  disabled={true}
                  className={`${radioInputClass} mt-1 rounded cursor-not-allowed opacity-60`}
                />
                <span className="text-sm text-gray-700">
                  {t.pdpaConsentStaff}
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mt-6 mb-2 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 sm:gap-0 mt-8 pt-6 sm:mt-12 sm:pt-8 border-t border-gray-100 w-full">
            {step > 1 && !readOnly ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-5 py-2.5 rounded-xl font-medium transition-colors text-sm sm:text-base order-2 sm:order-1 flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap"
              >
                <FaArrowLeft /> {lang === 'TH' ? 'ย้อนกลับ' : 'Back'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(isEditMode ? '/staff/profile' : '/staff', { replace: true })}
                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-5 py-2.5 rounded-xl font-medium transition-colors text-sm sm:text-base order-2 sm:order-1 flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap"
              >
                <FaArrowLeft /> {lang === 'TH' ? 'ย้อนกลับ' : 'Back'}
              </button>
            )}

            {step < 5 && !isEditMode && (
              <button
                onClick={triggerClearData}
                type="button"
                className="text-gray-400 hover:text-red-500 text-sm transition-colors cursor-pointer underline underline-offset-2 order-3 sm:order-2 mt-2 sm:mt-0 pb-2 sm:pb-0 whitespace-nowrap"
              >
                {lang === 'TH' ? 'ล้างข้อมูลหน้านี้' : 'Clear this page'}
              </button>
            )}

            {isEditMode && step < totalSteps && !readOnly && (
              <button
                type="button"
                disabled={submitting || !hasChanges}
                onClick={handleGoToVerify}
                className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md text-sm sm:text-base order-1 sm:order-2 whitespace-nowrap ${!hasChanges ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg cursor-pointer"}`}
              >
                {t.btnEditSubmit}
              </button>
            )}

            {step < totalSteps ? (
              <button
                key="btn-next"
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152b47] text-white px-6 sm:px-8 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base order-1 sm:order-3 whitespace-nowrap"
              >{t.btnNext}</button>
            ) : (
              !readOnly && (
                <button
                  key="btn-submit"
                  type="submit"
                  disabled={submitting || (isEditMode && !hasChanges)}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm sm:text-base order-1 sm:order-3 whitespace-nowrap ${isEditMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#1e3a5f] hover:bg-[#152b47] text-white"}`}
                >
                  {submitting ? t.btnSubmitting : (isEditMode ? t.btnEditSubmit : t.btnSubmit)}
                </button>
              )
            )}
          </div>
        </form>
      </div>
      {/* Locked Field Modal */}
      {showLockedModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowLockedModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-red-50/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                {lang === 'TH' ? 'คุณไม่สามารถแก้ไขข้อมูลดังกล่าวได้' : 'Cannot edit this field'}
              </h3>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLockedModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {lang === 'TH' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <a
                  href="https://line.me/R/ti/p/@122ddost"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl text-white font-medium bg-[#00B900] hover:bg-[#00a000] transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <FaLine className="w-5 h-5" />
                  {lang === 'TH' ? 'ติดต่อทีมงาน' : 'Contact Us'}
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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

      {/* Custom Clear Modal */}
      {showClearModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowClearModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-red-50/50">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                {lang === 'TH' ? 'ล้างข้อมูลหน้านี้' : 'Clear Data'}
              </h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {lang === 'TH' ? 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลในหน้านี้?' : 'Are you sure you want to clear all inputs on this page?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
                >
                  {lang === 'TH' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-md"
                >
                  {lang === 'TH' ? 'ตกลง' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Discard Changes Beautiful Modal */}
      {showDiscardModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowDiscardModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-[320px] w-full transform transition-all scale-100 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2 text-center leading-tight">
              {lang === 'TH' ? 'ละทิ้งการเปลี่ยนแปลง?' : 'Discard changes?'}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
              {lang === 'TH'
                ? 'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก หากกดย้อนกลับ ข้อมูลที่แก้ไขไว้จะสูญหาย'
                : 'You have unsaved changes. If you go back, these changes will be lost.'}
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                {lang === 'TH' ? 'แก้ไขต่อ' : 'Keep editing'}
              </button>
              <button
                onClick={() => {
                  setShowDiscardModal(false);
                  navigate('/staff/profile');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                {lang === 'TH' ? 'ละทิ้ง' : 'Discard'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StaffRegister;
