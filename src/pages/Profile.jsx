import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { useRegistration } from '../contexts/RegContext';
import { FaArrowLeft } from 'react-icons/fa';
import LoadingScreen from '../components/LoadingScreen';

import bImg from '../assets/b.png';
import logoImg from '../assets/Logo.png';

const contentLang = {
  TH: {
    langBtn: 'TH',
    back: 'กลับ',
    profile: 'โปรไฟล์ของฉัน',
    fullName: 'ชื่อ-นามสกุล',
    studentId: 'รหัสนักศึกษา',
    department: 'ภาควิชา',
    shirtSize: 'ไซซ์เสื้อ',
  },
  EN: {
    langBtn: 'EN',
    back: 'Back',
    profile: 'My Profile',
    fullName: 'Full Name',
    studentId: 'Student ID',
    department: 'Department',
    shirtSize: 'Shirt Size',
  }
};

const deptTranslationsEN = {
  "วิศวกรรมคอมพิวเตอร์": "Computer Engineering",
  "วิศวกรรมโยธา": "Civil Engineering",
  "วิศวกรรมเคมี": "Chemical Engineering",
  "วิศวกรรมไฟฟ้า": "Electrical Engineering",
  "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม": "Electronics and Telecommunication Engineering",
  "วิศวกรรมสิ่งแวดล้อม": "Environmental Engineering",
  "วิศวกรรมระบบควบคุมและเครื่องมือวัด": "Control Systems and Instrumentation Engineering",
  "วิศวกรรมเครื่องกล": "Mechanical Engineering",
  "วิศวกรรมอุตสาหการ": "Production Engineering",
  "วิศวกรรมเครื่องมือและวัสดุ": "Tool and Materials Engineering"
};

const Profile = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { isRegistered, regData, loading } = useRegistration();
  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');
  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };

  const t = contentLang[lang];

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, []);

  const displayRegData = regData && regData.firstName ? regData : {
    firstName: "",
    lastName: "",
    department: "",
    shirtSize: "",
    studentId: ""
  };

  const qrValue = `${userProfile?.userId || 'UNKNOWN_LINE_ID'}:${displayRegData?.studentId || 'UNKNOWN'}`;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pb-6 overflow-x-hidden relative">
      {/* Bow Image Fixed at Top-Left */}
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" />

      {/* Top Section Wrapper to push everything up */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logos & Header Section */}
        <div className="w-full flex justify-center lg:justify-start items-center -mt-8 -mb-5 relative z-10 min-h-[4rem] text-white">
          <div className="flex items-center z-10">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-24 sm:h-32 md:h-36 object-contain drop-shadow-lg" />
          </div>
          <div className="absolute right-0 z-20">
            <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} type="button" className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer text-white">
              <span className="mr-1">🌐</span> <span className="w-6 text-center inline-block">{t.langBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Back Button positioned nicely above the content */}
      <div className="w-full max-w-sm mt-8 mb-2 flex justify-start z-10 relative">
        <button
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <FaArrowLeft />
          <span>{t.back}</span>
        </button>
      </div>

      <div className="text-center mb-6 z-10 relative">
        <h1 className="text-2xl font-bold text-magical-gold text-glow">
          {t.profile}
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center relative overflow-hidden">
        {/* Top Decorative */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-magical-purple to-magical-light"></div>

        {/* Line Profile Image */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 mb-2 shadow-sm flex items-center justify-center bg-gray-50 text-gray-400">
          {userProfile?.pictureUrl ? (
            <img src={userProfile.pictureUrl} alt="LINE Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>

        {/* Line Display Name */}
        <div className="text-lg font-bold mb-6 text-gray-800">
          {userProfile?.displayName || "LINE User"}
        </div>

        {/* QR Code */}
        <div className="bg-white p-3 rounded-xl mb-8 shadow-md border border-gray-100 flex justify-center w-full max-w-[280px]">
          <QRCodeSVG
            value={qrValue}
            size={260}
            level="H"
            includeMargin={false}
            className="w-full h-auto rounded-md"
          />
        </div>

        {/* User Info */}
        <div className="w-full space-y-3 text-sm text-gray-800 mb-6">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.fullName}</span>
            <span className="font-semibold text-right ml-4">{displayRegData.firstName} {displayRegData.lastName}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.studentId}</span>
            <span className="font-semibold text-right ml-4">{displayRegData.studentId}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.department}</span>
            <span className="font-semibold text-right ml-4">
              {lang === 'EN' ? (deptTranslationsEN[displayRegData.department] || displayRegData.department) : displayRegData.department}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.shirtSize}</span>
            <span className="font-semibold text-[#1e3a5f] text-right ml-4">{displayRegData.shirtSize}</span>
          </div>
        </div>

        {/* Edit Button */}
        <div className="w-full flex flex-col items-center">
          {(() => {
            const editCount = displayRegData.editCount || 0;
            const remainingEdits = 2 - editCount;
            const deadlineIso = import.meta.env.VITE_EDIT_DEADLINE;
            const deadline = deadlineIso ? new Date(deadlineIso) : null;
            const isPastDeadline = deadline ? new Date() > deadline : false;
            const isShirtOrdered = displayRegData.is_shirt_ordered === true;
            const canEdit = remainingEdits > 0 && !isPastDeadline && !isShirtOrdered;

            const deadlineDisplay = deadline ? new Intl.DateTimeFormat('th-TH', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }).format(deadline) : '';

            return (
              <>
                <button
                  onClick={() => navigate('/register')}
                  disabled={!canEdit}
                  className={`w-full max-w-[280px] py-3 rounded-xl font-bold text-sm transition-all shadow-md ${canEdit
                      ? "bg-[#1e3a5f] hover:bg-[#152b47] text-white cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                    }`}
                >
                  แก้ไขข้อมูล
                </button>
                <div className="text-center mt-3 text-xs text-gray-500 space-y-1">
                  {isShirtOrdered ? (
                    <p className="text-gray-500">ไม่สามารถแก้ไขได้เนื่องจากระบบได้ทำการสั่งเสื้อไปแล้ว</p>
                  ) : isPastDeadline ? (
                    <p className="text-gray-500">หมดเขตการแก้ไขข้อมูลแล้ว</p>
                  ) : remainingEdits <= 0 ? (
                    <p className="text-gray-500">คุณใช้สิทธิ์แก้ไขข้อมูลครบ 2 ครั้งแล้ว</p>
                  ) : (
                    <>
                      <p>สามารถแก้ไขได้อีก {remainingEdits} ครั้ง</p>
                      {deadline && <p>ภายในวันที่ {deadlineDisplay}</p>}
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Profile;
