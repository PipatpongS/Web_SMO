import codecs
import re

with codecs.open('apps/student-reg/src/pages/StaffRegister.jsx', 'r', 'utf-8') as f:
    content = f.read()

pattern = re.compile(r'if \(\!isChanged\) \{.*?\{/\* Bow Image Fixed at Top-Left \*/\}', re.DOTALL)

replacement = """if (!isChanged) {
        setSubmitting(false);
        setShowConfirmModal(false);
        setError(lang === 'TH' ? 'ไม่พบการเปลี่ยนแปลงข้อมูล (หรือมีการพิมพ์แค่ช่องว่าง)' : 'No changes detected (or only spaces were added).');
        return;
      }
    }

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

    setSubmitting(false);

    if (result.success) {
      setFormData({
        titlePrefix: '',
        nickname: '',
        year: '',
        lineId: '',
        role1: '',
        role2: '',
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
          newData.nickname = '';
          newData.year = '';
          newData.lineId = '';
          newData.role1 = '';
          newData.role2 = '';
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
      {/* Bow Image Fixed at Top-Left */}"""

new_content = pattern.sub(replacement, content)
with codecs.open('apps/student-reg/src/pages/StaffRegister.jsx', 'w', 'utf-8') as f:
    f.write(new_content)
print("Repaired!")
