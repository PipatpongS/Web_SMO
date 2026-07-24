import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { useRegistration } from '../contexts/RegContext';
import { FaArrowLeft, FaClipboardList } from 'react-icons/fa';
import LoadingScreen from '../components/LoadingScreen';
import { isEditClosed, EDIT_DEADLINE } from '../config/timeConfig';

import bImg from '../assets/b.png';
import logoImg from '../assets/Logo.png';

const contentLang = {
  TH: {
    langBtn: 'TH',
    back: 'กลับหน้าหลัก',
    profile: 'โปรไฟล์ของฉัน',
    fullName: 'ชื่อ-นามสกุล',
    studentId: 'รหัสนักศึกษา',
    department: 'ภาควิชา',
    shirtSize: 'ไซซ์เสื้อ',
    editBtn: 'แก้ไขข้อมูล',
    contactMsg: 'หากต้องการแก้ไขข้อมูลเพิ่มเติม สามารถติดต่อได้ที่',
    chatBtn: 'แชทกับเราเลย',
    remainingEdits: 'สามารถแก้ไขได้อีก',
    remainingUnit: 'ครั้ง',
    deadlinePrefix: 'ภายในวันที่',
  },
  EN: {
    langBtn: 'EN',
    back: 'Back to Home',
    profile: 'My Profile',
    fullName: 'Full Name',
    studentId: 'Student ID',
    department: 'Department',
    shirtSize: 'Shirt Size',
    editBtn: 'Edit Information',
    contactMsg: 'For further edits, please contact us via',
    chatBtn: 'Chat with us',
    remainingEdits: 'You can edit',
    remainingUnit: 'more time(s)',
    deadlinePrefix: 'Before',
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
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showSpecialShirtModal, setShowSpecialShirtModal] = useState(false);
  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };

  const t = contentLang[lang];

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (showVerifiedModal || showSpecialShirtModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVerifiedModal, showSpecialShirtModal]);

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
      <div className="w-full max-w-lg flex flex-col items-center">
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
      <div className="w-full max-w-lg mt-8 mb-6 flex justify-start z-10 relative pl-2">
        <button
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <FaArrowLeft />
          <span>{t.back}</span>
        </button>
      </div>

      <div className="text-center mb-8 mt-2 z-10 relative">
        <h1 className="text-3xl font-bold text-magical-gold text-glow">
          {t.profile}
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg flex flex-col items-center relative overflow-hidden">
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
        <div className="flex items-center gap-1.5 text-lg font-bold mb-2 text-gray-800">
          <span>{userProfile?.displayName || "LINE User"}</span>
          {displayRegData.is_verified && (
            <svg 
              className="w-5 h-5 text-blue-500 cursor-pointer hover:scale-110 transition-transform active:scale-95" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              title={lang === 'TH' ? 'ยืนยันตัวตนในระบบโดยแอดมินแล้ว' : 'Identity verified by Admin'}
              onClick={() => setShowVerifiedModal(true)}
            >
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Activity Details Button */}
        <button
          type="button"
          onClick={() => navigate('/activity-details')}
          className="mb-6 px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-purple-400/30"
        >
          <FaClipboardList className="text-sm" />
          <span>{lang === 'TH' ? 'รายละเอียดกิจกรรม' : 'Activity Details'}</span>
        </button>

        {/* Check Walk-in Status */}
        {(() => {
          const isWalkinPending = displayRegData?.walkin_status === 'PENDING_APPROVAL' || (displayRegData?.note === 'รอบหน้างาน' && !displayRegData?.walkin_verified);
          
          let tempShortCode = displayRegData?.walkin_temp_short_code;
          if (!tempShortCode || !tempShortCode.startsWith('W-')) {
            tempShortCode = `W-${displayRegData?.short_code || 'WALK'}`;
          }
          const tempQrValue = displayRegData?.walkin_temp_qr || `WALKIN_TEMP:${userProfile?.userId}:${tempShortCode}:${Date.now()}`;

          if (isWalkinPending) {
            return (
              <div className="w-full flex flex-col items-center">
                {/* Pending Warning Banner */}
                <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-5 text-center space-y-1.5 shadow-sm">
                  <span className="text-2xl block mb-1">⏳</span>
                  <h2 className="text-base sm:text-lg font-black text-amber-900 leading-tight">
                    {lang === 'TH' ? 'รอสตาฟอนุมัติการลงทะเบียน (หน้างานเท่านั้น)' : 'Pending Staff On-site Approval'}
                  </h2>
                  <p className="text-xs text-amber-800 font-medium">
                    {lang === 'TH'
                      ? 'โปรดแสดง QR Code นี้ให้สตาฟที่โต๊ะลงทะเบียนเพื่อตรวจบัตรและอนุมัติการเข้างาน'
                      : 'Please show this QR Code to staff at the registration desk for verification'}
                  </p>
                </div>

                {/* Temporary Walk-in QR Code */}
                <div className="bg-white p-3.5 rounded-2xl mb-2 shadow-lg border-2 border-amber-200 flex justify-center w-full max-w-[280px]">
                  <QRCodeSVG
                    value={tempQrValue}
                    size={260}
                    level="H"
                    includeMargin={false}
                    className="w-full h-auto rounded-xl"
                  />
                </div>

                {/* Temp Short Code Badge */}
                {tempShortCode && (
                  <div className="mb-5 px-5 py-1.5 bg-amber-100 text-amber-950 border-2 border-amber-300 shadow-sm rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm tracking-wide">
                    <span>{lang === 'TH' ? 'รหัสยืนยัน' : 'Verification Code'}:</span>
                    <span className="ml-1.5 font-black text-amber-900 text-sm sm:text-base">{tempShortCode}</span>
                  </div>
                )}

                {/* User Basic Info Preview */}
                <div className="w-full space-y-2.5 text-sm text-gray-800 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500 whitespace-nowrap">{t.fullName}</span>
                    <span className="font-bold text-right ml-4">
                      {displayRegData.firstName} {displayRegData.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500 whitespace-nowrap">{t.studentId}</span>
                    <span className="font-bold text-right ml-4">
                      {displayRegData.studentId === '69070500000'
                        ? (lang === 'TH' ? 'ยังไม่ได้รับรหัสนักศึกษา' : 'Not yet received')
                        : displayRegData.studentId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 whitespace-nowrap">รอบการลงทะเบียน</span>
                    <span className="font-bold text-amber-700 text-right ml-4">รอบหน้างาน (รออนุมัติ)</span>
                  </div>
                </div>
              </div>
            );
          }

          {/* Official Registration Ticket (Unlocked after approval) */}
          return (
            <>
              {/* Official QR Code */}
              <div className="bg-white p-3.5 rounded-2xl mb-3 shadow-lg border border-gray-100 flex justify-center w-full max-w-[280px]">
                <QRCodeSVG
                  value={qrValue}
                  size={260}
                  level="H"
                  includeMargin={false}
                  className="w-full h-auto rounded-xl"
                />
              </div>

              {/* Short Code Badge right under QR Code */}
              {displayRegData.short_code && (
                <div className="mb-5 px-4 py-1 bg-purple-50 text-purple-900 border border-purple-200/80 shadow-sm rounded-full flex items-center justify-center font-mono font-extrabold text-xs sm:text-sm tracking-[0.15em]">
                  {displayRegData.short_code}
                </div>
              )}

              {/* User Info */}
              <div className="w-full space-y-3 text-sm text-gray-800 mb-6">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 whitespace-nowrap">{t.fullName}</span>
                  <span className="font-semibold text-right ml-4">
                    {displayRegData.firstName} {displayRegData.middleName ? `${displayRegData.middleName} ` : ''}{displayRegData.lastName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 whitespace-nowrap">{t.studentId}</span>
                  <span className="font-semibold text-right ml-4">
                    {displayRegData.studentId === '69070500000'
                      ? (lang === 'TH' ? 'ยังไม่ได้รับรหัสนักศึกษา' : 'Not yet received')
                      : displayRegData.studentId}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 whitespace-nowrap">{t.department}</span>
                  <span className="font-semibold text-right ml-4">
                    {lang === 'EN' ? (deptTranslationsEN[displayRegData.department] || displayRegData.department) : displayRegData.department}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
                  <span className="text-gray-500 whitespace-nowrap">{t.shirtSize}</span>
                  <div className="flex items-center gap-2">
                    {((displayRegData.note && displayRegData.note.includes('รอบพิเศษ')) || (displayRegData.Note && displayRegData.Note.includes('รอบพิเศษ'))) && (
                      <button
                        type="button"
                        onClick={() => setShowSpecialShirtModal(true)}
                        className="text-[11px] text-amber-600 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all px-2 py-0.5 rounded-full border border-amber-200 cursor-pointer flex items-center gap-1 font-medium"
                      >
                        ⚠️ {lang === 'TH' ? 'เงื่อนไขพิเศษ' : 'Special Terms'}
                      </button>
                    )}
                    <span className="font-semibold text-[#1e3a5f] text-right ml-4">{displayRegData.shirtSize}</span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Edit Button */}
        <div className="w-full flex flex-col items-center">
          {(() => {
            const editCount = displayRegData.editCount || 0;
            const remainingEdits = 2 - editCount;
            const deadlineIso = EDIT_DEADLINE;
            const deadline = deadlineIso ? new Date(deadlineIso) : null;
            const isPastDeadline = isEditClosed();
            const isShirtOrdered = displayRegData.is_shirt_ordered === true;
            const canEdit = remainingEdits > 0 && !isPastDeadline;

            const deadlineDisplay = deadline ? new Intl.DateTimeFormat('th-TH', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }).format(deadline) : '';

            return (
              <>
                <button
                  onClick={() => navigate('/register', { state: { readOnly: true } })}
                  className="w-full max-w-[280px] py-3 rounded-xl font-bold text-sm transition-all shadow-md bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50 cursor-pointer mb-3"
                >
                  {lang === 'TH' ? 'ดูข้อมูลส่วนตัวเพิ่มเติม' : 'View Personal Information'}
                </button>
                <button
                  disabled={!canEdit}
                  onClick={() => navigate('/register', { state: { readOnly: false } })}
                  className={`w-full max-w-[280px] py-3 rounded-xl font-bold text-sm transition-all shadow-md ${canEdit
                    ? "bg-[#1e3a5f] hover:bg-[#152b47] text-white cursor-pointer"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {t.editBtn}
                </button>
                <div className="text-center mt-4 text-xs text-gray-500 space-y-2">
                  {!canEdit ? (
                    <>
                      <p className="text-gray-500 leading-relaxed">{t.contactMsg}</p>
                      <a
                        href="https://line.me/R/ti/p/@122ddost"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#00B900] hover:bg-[#00a000] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all mt-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                        SMO VIDVA BANGMOD
                      </a>
                    </>
                  ) : (
                    <>
                      <p>{t.remainingEdits} {remainingEdits} {t.remainingUnit}</p>
                      {deadline && <p>{t.deadlinePrefix} {deadlineDisplay}</p>}
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Verified Beautiful Modal - Rendered via Portal to avoid CSS transform issues */}
      {showVerifiedModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowVerifiedModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-[280px] w-full transform transition-all scale-100 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
              <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2 text-center leading-tight">
              {lang === 'TH' ? 'ยืนยันตัวตนสำเร็จ' : 'Verified'}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
              {lang === 'TH' ? 'บัญชีนี้ได้รับการยืนยันตัวตนในระบบโดยแอดมินเรียบร้อยแล้ว' : 'This account has been verified by the administrator.'}
            </p>
            <button 
              onClick={() => setShowVerifiedModal(false)}
              className="w-full py-3 bg-[#1e3a5f] hover:bg-[#152b47] text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              {lang === 'TH' ? 'ตกลง' : 'OK'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Special Shirt Modal */}
      {showSpecialShirtModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowSpecialShirtModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-[300px] w-full transform transition-all scale-100 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50/50">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2 text-center leading-tight">
              {lang === 'TH' ? 'เงื่อนไขไซซ์เสื้อ' : 'Shirt Size Condition'}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-4 leading-relaxed">
              {lang === 'TH' 
                ? 'หากลงทะเบียนในรอบพิเศษจะได้รับไซซ์เสื้อเป็น XL เท่านั้น ไม่สามารถแก้ไขได้' 
                : 'If registered in the special round, the shirt size will be XL only and cannot be modified.'}
            </p>
            <div className="w-full flex flex-col items-center mb-6">
              <span className="text-xs text-gray-400 mb-2 text-center">
                {lang === 'TH' ? 'หากมีคำถามเพิ่มเติม โปรดติดต่อ' : 'For any further questions, please contact'}
              </span>
              <a
                href="https://line.me/R/ti/p/@122ddost"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#00B900] hover:bg-[#00a000] text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span>LINE OA (SMO VIDVA BANGMOD)</span>
              </a>
            </div>
            <button 
              onClick={() => setShowSpecialShirtModal(false)}
              className="w-full py-3 bg-[#1e3a5f] hover:bg-[#152b47] text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              {lang === 'TH' ? 'ตกลง' : 'OK'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
