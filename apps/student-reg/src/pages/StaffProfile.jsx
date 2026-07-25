import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStaffRegistration } from '../contexts/StaffRegContext';
import { FaArrowLeft, FaHeartbeat, FaRunning, FaTools, FaCamera, FaChevronRight, FaCheckCircle, FaTimesCircle, FaClipboardList, FaLine } from 'react-icons/fa';
import LoadingScreen from '../components/LoadingScreen';
import { isStaffEditClosed, STAFF_EDIT_DEADLINE } from '../config/timeConfig';

import bImg from '../assets/b.png';
import logoImg from '../assets/Logo.png';
import sponsorLogo from '../assets/Sponser/Daimond/cropped_logo_white.png';

const contentLang = {
  TH: {
    langBtn: 'TH',
    back: 'กลับหน้าหลัก',
    profile: 'โปรไฟล์ Staff',
    fullName: 'ชื่อ-นามสกุล',
    studentId: 'รหัสนักศึกษา',
    department: 'ภาควิชา',
    year: 'ชั้นปี',
    role1: 'ตำแหน่งที่สมัคร (อันดับ 1)',
    role2: 'ตำแหน่งที่สมัคร (อันดับ 2)',
    editBtn: 'แก้ไขข้อมูล',
    viewMoreBtn: 'ดูข้อมูลเพิ่มเติม',
    statusTitle: 'สถานะใบสมัคร',
    statusSubmitted: 'ส่งใบสมัครเสร็จสิ้น',
    statusSelected: 'ได้รับการคัดเลือกให้ปฏิบัติงานในตำแหน่ง',
    statusRejected: 'ไม่ผ่านการคัดเลือก',
    statusRejectedDesc: 'ขอขอบคุณที่ให้ความสนใจสมัครเป็น Staff ในกิจกรรมปฐมนิเทศนักศึกษาใหม่ คณะวิศวกรรมศาสตร์ ในครั้งนี้ ทางผู้จัดงานขอขอบคุณในความตั้งใจ และหวังว่าจะมีโอกาสได้ร่วมงานกันในกิจกรรมครั้งถัดไป',
    viewRoleDetails: 'ดูรายละเอียดตำแหน่ง',
    contactMsg: 'หากต้องการแก้ไขข้อมูลเพิ่มเติม สามารถติดต่อได้ที่',
    chatBtn: 'แชทกับเราเลย',
    remainingEdits: 'สามารถแก้ไขได้อีก',
    remainingUnit: 'ครั้ง',
    deadlinePrefix: 'ภายในวันที่',
    close: 'ปิด',
    joinLineGroupBtn: 'กดเข้าร่วมกลุ่ม LINE Staff',
  },
  EN: {
    langBtn: 'EN',
    back: 'Back to Home',
    profile: 'Staff Profile',
    fullName: 'Full Name',
    studentId: 'Student ID',
    department: 'Department',
    year: 'Year',
    role1: 'Applied Role (1st Choice)',
    role2: 'Applied Role (2nd Choice)',
    editBtn: 'Edit Information',
    viewMoreBtn: 'View More Information',
    statusTitle: 'Application Status',
    statusSubmitted: 'Application Submitted',
    statusSelected: 'Selected for the position of',
    statusRejected: 'Not Selected',
    statusRejectedDesc: 'Thank you for your interest in joining the Staff team for the KMUTT Engineering Freshy Orientation. We appreciate your dedication and hope to have the opportunity to work together in future activities.',
    viewRoleDetails: 'View Role Details',
    contactMsg: 'For further edits, please contact us via',
    chatBtn: 'Chat with us',
    remainingEdits: 'You can edit',
    remainingUnit: 'more time(s)',
    deadlinePrefix: 'Before',
    close: 'Close',
    joinLineGroupBtn: 'Join LINE Staff Group',
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

const rolesData = [
  {
    key: 'ฝ่ายพยาบาล',
    icon: FaHeartbeat,
    iconColor: 'text-red-500',
    title: 'ฝ่ายพยาบาล (10 คน)',
    titleEN: 'Nursing Staff (10 members)',
    date: '26 กรกฎาคม 2569',
    dateEN: 'July 26, 2026',
    duty: 'แจกไม้แอมโมเนียให้น้อง และส่งต่อน้องให้ EMS',
    dutyEN: 'Distribute ammonia sticks and transfer patients to EMS',
    note: 'ไม่จำเป็นต้องมีบัตรพยาบาล',
    noteEN: 'No nursing license required',
    noteColor: 'text-red-600',
  },
  {
    key: 'ฝ่ายกิจกรรม',
    icon: FaRunning,
    iconColor: 'text-orange-500',
    title: 'ฝ่ายกิจกรรม (40 คน)',
    titleEN: 'Activity Staff (40 members)',
    date: '25 - 26 กรกฎาคม 2569',
    dateEN: 'July 25-26, 2026',
    duty: 'จัดกิจกรรมให้น้อง ๆ, นำวิ่งรับเกียร์, ทำกิจกรรมบูมต้อนรับ',
    dutyEN: 'Organize activities, lead gear run, welcome cheers',
    note: 'มีการซ้อมกิจกรรมวันที่ 21 และ 23 กรกฏาคม 2569',
    noteEN: 'Rehearsals on July 21 and 23, 2026',
    noteColor: 'text-orange-600',
  },
  {
    key: 'ฝ่ายสถานที่และสวัสดิการ',
    icon: FaTools,
    iconColor: 'text-slate-500',
    title: 'ฝ่ายสถานที่และสวัสดิการ (10 คน)',
    titleEN: 'Venue & Welfare Staff (10 members)',
    date: '25 - 26 กรกฎาคม 2569',
    dateEN: 'July 25-26, 2026',
    duty: 'ช่วยเคลื่อนย้าย จัดวางอุปกรณ์ต่าง ๆ, แจกอาหารว่างและเครื่องดื่ม, หน้าที่อื่น ๆ ที่ได้รับมอบหมาย',
    dutyEN: 'Move and arrange equipment, distribute snacks and drinks, other assigned tasks',
    note: 'มีการนัดหมายจัดสถานที่ วันที่ 24 กรกฎาคม 2569',
    noteEN: 'Venue setup meeting on July 24, 2026',
    noteColor: 'text-orange-600',
  },
  {
    key: 'ประชาสัมพันธ์',
    icon: FaCamera,
    iconColor: 'text-blue-500',
    title: 'ประชาสัมพันธ์ (3 คน)',
    titleEN: 'PR Staff (3 members)',
    date: '25 - 26 กรกฎาคม 2569',
    dateEN: 'July 25-26, 2026',
    duty: 'เก็บบรรยากาศภายในกิจกรรม, จัดทำคลิป และเนื้อหาประชาสัมพันธ์ เผยแพร่ผ่านช่องทางออนไลน์, หน้าที่อื่น ๆ ที่ได้รับมอบหมาย',
    dutyEN: 'Capture event atmosphere, create clips and PR content for online channels, other assigned tasks',
    note: 'อาจมีการนัดหมายเพิ่มเติม',
    noteEN: 'Additional appointments may be scheduled',
    noteColor: 'text-orange-600',
  },
];

const StaffProfile = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { regData, loading } = useStaffRegistration();
  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };

  const t = contentLang[lang];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (showRoleModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRoleModal]);

  const displayRegData = regData && regData.firstName ? regData : {
    firstName: "",
    lastName: "",
    middleName: "",
    department: "",
    year: "",
    role1: "",
    role2: "",
    studentId: "",
    staffStatus: ""
  };

  // Parse staffStatus
  const staffStatus = displayRegData.staffStatus || 'ส่งใบสมัครเสร็จสิ้น';
  const isSelected = staffStatus.startsWith('ได้รับการคัดเลือกให้ปฏิบัติงานในตำแหน่ง');
  const isRejected = staffStatus === 'ไม่ผ่านการคัดเลือก';
  const selectedRoleName = isSelected ? staffStatus.replace('ได้รับการคัดเลือกให้ปฏิบัติงานในตำแหน่ง ', '').trim() : '';

  const handleViewRoleDetails = () => {
    // Find the role that matches the selected role name
    const role = rolesData.find(r => r.key === selectedRoleName || r.title.includes(selectedRoleName));
    if (role) {
      setSelectedRole(role);
      setShowRoleModal(true);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Status badge styling
  const getStatusStyle = () => {
    if (isSelected) {
      return {
        bg: 'bg-emerald-50 border-emerald-200',
        icon: <FaCheckCircle className="w-6 h-6" />,
        textColor: 'text-emerald-700',
        badgeColor: 'bg-emerald-100 text-emerald-700',
      };
    }
    if (isRejected) {
      return {
        bg: 'bg-red-50 border-red-200',
        icon: <FaTimesCircle className="w-6 h-6" />,
        textColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-600',
      };
    }
    // Submitted
    return {
      bg: 'bg-blue-50 border-blue-200',
      icon: <FaClipboardList className="w-5 h-5" />,
      textColor: 'text-blue-700',
      badgeColor: 'bg-blue-100 text-blue-700',
    };
  };

  const statusStyle = getStatusStyle();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pb-6 overflow-x-hidden relative">
      {/* Bow Image Fixed at Top-Left */}
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" />

      {/* Top Section */}
      <div className="w-full max-w-lg flex flex-col items-center">
        <div className="w-full flex justify-center lg:justify-start items-center -mt-8 -mb-5 relative z-10 min-h-[4rem] text-white">
          <div className="flex items-center gap-1.5 sm:gap-3 z-10 pl-12 sm:pl-0 pr-16 sm:pr-24 max-w-full">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-16 sm:h-32 md:h-36 object-contain drop-shadow-lg shrink-0" />
            <img src={sponsorLogo} alt="Sponsor Logo" className="h-5 sm:h-10 md:h-12 object-contain drop-shadow-lg shrink min-w-0" />
          </div>
          <div className="absolute right-0 z-20">
            <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} type="button" className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer text-white">
              <span className="mr-1">🌐</span> <span className="w-6 text-center inline-block">{t.langBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="w-full max-w-lg mt-8 mb-6 flex justify-start z-10 relative pl-2">
        <button
          onClick={() => navigate('/staff')}
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

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg flex flex-col items-center relative overflow-hidden">
        {/* Top Decorative */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e]"></div>

        {/* LINE Profile Image */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 mb-2 shadow-sm flex items-center justify-center bg-gray-50 text-gray-400">
          {userProfile?.pictureUrl ? (
            <img src={userProfile.pictureUrl} alt="LINE Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>

        {/* LINE Display Name */}
        <div className="flex items-center gap-1.5 text-lg font-bold mb-6 text-gray-800">
          <span>{userProfile?.displayName || "LINE User"}</span>
        </div>

        {/* Application Status Banner */}
        <div className={`relative w-full rounded-2xl p-6 mb-8 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${
          isSelected ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200/60' :
          isRejected ? 'bg-gradient-to-br from-red-50 via-rose-50 to-red-100/50 border border-red-200/60' :
          'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100/50 border border-blue-200/60'
        }`}>
          {/* Background Decorative Pattern */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none mix-blend-multiply flex items-center justify-center">
            <div className={`w-full h-full rounded-full ${
              isSelected ? 'bg-emerald-400' :
              isRejected ? 'bg-red-400' :
              'bg-blue-400'
            }`}></div>
          </div>
          
          <div className="relative z-10 flex flex-col gap-3 items-center text-center">
            <div className="flex flex-col items-center gap-3 mb-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full shadow-sm text-2xl ${
                isSelected ? 'bg-emerald-100/80 text-emerald-600 border border-emerald-200' :
                isRejected ? 'bg-red-100/80 text-red-600 border border-red-200' :
                'bg-blue-100/80 text-blue-600 border border-blue-200'
              }`}>
                {statusStyle.icon}
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest opacity-80 ${statusStyle.textColor}`}>{t.statusTitle}</span>
            </div>
            
            <div className="mt-1 w-full">
              {isSelected ? (
                <>
                  <p className={`font-semibold ${statusStyle.textColor} text-base leading-relaxed flex flex-col gap-1 items-center`}>
                    <span className="opacity-90">{lang === 'TH' ? t.statusSelected : t.statusSelected}</span>
                    <span className="text-xl font-extrabold text-emerald-700 tracking-tight drop-shadow-sm">{selectedRoleName}</span>
                  </p>
                  <button
                    onClick={handleViewRoleDetails}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-white/70 hover:bg-white text-emerald-700 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer border border-emerald-100 mx-auto w-fit"
                  >
                    <span>{t.viewRoleDetails}</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </>
              ) : isRejected ? (
                <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                  <p className={`font-extrabold ${statusStyle.textColor} text-xl tracking-tight`}>
                    {lang === 'TH' ? t.statusRejected : t.statusRejected}
                  </p>
                  <p className="text-red-700/80 text-xs sm:text-sm font-medium leading-relaxed">
                    {lang === 'TH' ? t.statusRejectedDesc : t.statusRejectedDesc}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 mt-1 w-full">
                  <p className={`font-semibold ${statusStyle.textColor} text-lg leading-relaxed tracking-tight`}>
                    {lang === 'TH' ? t.statusSubmitted : t.statusSubmitted}
                  </p>
                  <a
                    href="https://line.me/R/ti/g/RNNEhAjbkf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl text-sm font-bold transition-all shadow-[0_4px_12px_rgba(6,199,85,0.2)] hover:shadow-[0_6px_16px_rgba(6,199,85,0.3)] active:scale-95 cursor-pointer mx-auto w-fit"
                  >
                    <FaLine className="w-5 h-5" />
                    <span>{t.joinLineGroupBtn}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="w-full space-y-3 text-sm text-gray-800 mb-6">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.fullName}</span>
            <span className="font-semibold text-right ml-4">
              {displayRegData.firstName} {displayRegData.middleName ? `${displayRegData.middleName} ` : ''}{displayRegData.lastName}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.department}</span>
            <span className="font-semibold text-right ml-4">
              {lang === 'EN' ? (deptTranslationsEN[displayRegData.department] || displayRegData.department) : displayRegData.department}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.year}</span>
            <span className="font-semibold text-right ml-4">
              {displayRegData.year}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.role1}</span>
            <span className="font-semibold text-[#1e3a5f] text-right ml-4">
              {displayRegData.role1 || '-'}
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500 whitespace-nowrap">{t.role2}</span>
            <span className="font-semibold text-[#1e3a5f] text-right ml-4">
              {displayRegData.role2 || '-'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col items-center">
          {(() => {
            const editCount = displayRegData.editCount || 0;
            const remainingEdits = 2 - editCount;
            const deadlineIso = STAFF_EDIT_DEADLINE;
            const deadline = deadlineIso ? new Date(deadlineIso) : null;
            const isPastDeadline = isStaffEditClosed();
            const canEdit = remainingEdits > 0 && !isPastDeadline && !isSelected && !isRejected;

            const deadlineDisplay = deadline ? new Intl.DateTimeFormat('th-TH', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }).format(deadline) : '';

            return (
              <>
                <button
                  onClick={() => navigate('/staff/register', { state: { readOnly: true } })}
                  className="w-full max-w-[280px] py-3 rounded-xl font-bold text-sm transition-all shadow-md bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50 cursor-pointer mb-3"
                >
                  {t.viewMoreBtn}
                </button>
                <button
                  disabled={!canEdit}
                  onClick={() => navigate('/staff/register', { state: { readOnly: false } })}
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

      {/* Role Details Modal */}
      {showRoleModal && selectedRole && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowRoleModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-[360px] w-full transform transition-all scale-100 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className={`w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50`}>
              {React.createElement(selectedRole.icon, { className: `w-8 h-8 ${selectedRole.iconColor}` })}
            </div>
            <h3 className="text-lg font-extrabold text-[#1e3a5f] mb-4 text-center leading-tight">
              {lang === 'TH' ? selectedRole.title : selectedRole.titleEN}
            </h3>
            <div className="w-full space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-bold text-gray-800">{lang === 'TH' ? 'วันที่:' : 'Date:'}</span>{' '}
                {lang === 'TH' ? selectedRole.date : selectedRole.dateEN}
              </div>
              <div>
                <span className="font-bold text-gray-800">{lang === 'TH' ? 'หน้าที่:' : 'Duties:'}</span>{' '}
                {lang === 'TH' ? selectedRole.duty : selectedRole.dutyEN}
              </div>
              {selectedRole.note && (
                <div className={selectedRole.noteColor || 'text-gray-600'}>
                  <span className="font-bold">{lang === 'TH' ? 'หมายเหตุ:' : 'Note:'}</span>{' '}
                  {lang === 'TH' ? selectedRole.note : selectedRole.noteEN}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowRoleModal(false)}
              className="w-full mt-6 py-3 bg-[#1e3a5f] hover:bg-[#152b47] text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              {t.close}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StaffProfile;
