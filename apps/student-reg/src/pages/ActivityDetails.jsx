import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistration } from '../contexts/RegContext';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaExternalLinkAlt, FaUsers, FaMapPin } from 'react-icons/fa';
import LoadingScreen from '../components/LoadingScreen';

import bImg from '../assets/b.png';
import logoImg from '../assets/Logo.png';
import sponsorLogo from '../assets/Sponser/Daimond/cropped_logo_white.png';
import SponsorsSection from '../components/SponsorsSection';

const groupNames = {
  1: 'DREAM',
  2: 'DESIGN',
  3: 'BUILD',
  4: 'BLOOM',
  5: 'BEYOND'
};

const day25Info = {
  1: {
    TH: 'S4 อาคารวิศววัฒนะ',
    EN: 'Wissawa Wattana Building',
    map: 'https://maps.app.goo.gl/8S1CGsZbbkVjTMDT6?g_st=ic'
  },
  2: {
    TH: 'S11 อาคารเรียนรวม 5',
    EN: 'Classroom Building 5',
    map: 'https://maps.app.goo.gl/LksWQCSjLqr9WoEJ8?g_st=ic'
  },
  3: {
    TH: 'S12 อาคารเรียนรวม 4',
    EN: 'Classroom Building 4',
    map: 'https://maps.app.goo.gl/uZDNAcZyN7RRG4Nz5?g_st=ic'
  },
  4: {
    TH: 'N16 อาคารการเรียนรู้พหุวิทยาการ ชั้น 3',
    EN: '3rd Floor, Learning Exchange Building',
    map: 'https://maps.app.goo.gl/FJprGEV7odQrzb148?g_st=ic'
  },
  5: {
    TH: 'N16 อาคารการเรียนรู้พหุวิทยาการ ชั้น 1',
    EN: '1st Floor, Learning Exchange Building',
    map: 'https://maps.app.goo.gl/FJprGEV7odQrzb148?g_st=ic'
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

const contentLang = {
  TH: {
    langBtn: 'TH',
    back: 'กลับหน้าโปรไฟล์',
    title: 'รายละเอียดกิจกรรม',
    groupPrefix: 'กลุ่มกิจกรรมของคุณ',
    day24Title: '24 กรกฎาคม 2569',
    day24Event: 'รับเสื้อ',
    day24Time: '09.00 - 16.00 น.',
    day24Loc: 'สโมสรนักศึกษาคณะวิศวกรรมศาสตร์',
    
    day25Title: '25 กรกฎาคม 2569',
    day25Event: 'ลงทะเบียนกิจกรรม',
    day25Time: '08.30 - 09.00 น.',
    
    day26Title: '26 กรกฎาคม 2569',
    day26Event: 'ลงทะเบียนกิจกรรม',
    day26Note: (dept) => `เวลาและสถานที่ตามที่ภาควิชา${dept || 'ของคุณ'}นัดหมาย`,

    mapBtn: 'นำทางไปยังสถานที่',
    moreBtn: 'รายละเอียดกิจกรรมเพิ่มเติม',
    unassignedGroup: 'รออัพเดตภายในวันนี้'
  },
  EN: {
    langBtn: 'EN',
    back: 'Back to Profile',
    title: 'Activity Details',
    groupPrefix: 'Your Activity Group',
    day24Title: 'July 24, 2026',
    day24Event: 'Shirt Pickup',
    day24Time: '09:00 AM - 04:00 PM',
    day24Loc: 'The Student Union of The Faculty of Engineering',
    
    day25Title: 'July 25, 2026',
    day25Event: 'Activity Registration',
    day25Time: '08:30 AM - 09:00 AM',
    
    day26Title: 'July 26, 2026',
    day26Event: 'Activity Registration',
    day26Note: (dept) => `Time and location as scheduled by ${dept || 'your'} Department`,

    mapBtn: 'Navigate to Location',
    moreBtn: 'More Activity Details',
    unassignedGroup: 'Pending update today'
  }
};

const ActivityDetails = () => {
  const navigate = useNavigate();
  const { regData, loading } = useRegistration();
  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');

  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };

  const t = contentLang[lang];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const rawGroup = regData?.group ?? regData?.Group ?? null;
  const nameToNum = { 'DREAM': 1, 'DESIGN': 2, 'BUILD': 3, 'BLOOM': 4, 'BEYOND': 5 };
  const numToName = { 1: 'DREAM', 2: 'DESIGN', 3: 'BUILD', 4: 'BLOOM', 5: 'BEYOND' };

  let userGroupNum = null;
  let userGroupName = t.unassignedGroup;

  if (rawGroup !== null && rawGroup !== undefined && rawGroup !== '') {
    const strGroup = String(rawGroup).trim().toUpperCase().replace(/^กลุ่ม\s*/, '');
    if (nameToNum[strGroup]) {
      userGroupNum = nameToNum[strGroup];
      userGroupName = strGroup;
    } else if (numToName[strGroup]) {
      userGroupNum = Number(strGroup);
      userGroupName = numToName[strGroup];
    } else if (!isNaN(Number(strGroup))) {
      userGroupNum = Number(strGroup);
      userGroupName = strGroup;
    } else {
      userGroupName = strGroup;
    }
  }

  const userDept = regData?.department || '';
  const userDeptEN = deptTranslationsEN[userDept] || userDept;
  const deptDisplay = lang === 'EN' ? userDeptEN : userDept;

  const day25LocData = (userGroupNum && day25Info[userGroupNum]) ? day25Info[userGroupNum] : {
    TH: 'รออัพเดตภายในวันนี้',
    EN: 'Pending update today',
    map: 'https://maps.app.goo.gl/aof7XDdYLioapv2H6?g_st=ic'
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pb-10 overflow-x-hidden relative">
      {/* Bow Image */}
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-lg flex flex-col items-center">
        <div className="w-full flex justify-center lg:justify-start items-center -mt-8 -mb-5 relative z-10 min-h-[4rem] text-white">
          <div className="flex items-center gap-1.5 sm:gap-3 z-10 pl-12 sm:pl-0 pr-16 sm:pr-24 max-w-full">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-16 sm:h-32 md:h-36 object-contain drop-shadow-lg shrink-0" />
            <img src={sponsorLogo} alt="Sponsor Logo" className="h-5 sm:h-10 md:h-12 object-contain drop-shadow-lg shrink min-w-0" />
          </div>
          <div className="absolute right-0 z-20">
            <button
              onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')}
              type="button"
              className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer text-white"
            >
              <span className="mr-1">🌐</span> <span className="w-6 text-center inline-block">{t.langBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="w-full max-w-lg mt-8 mb-4 flex justify-start z-10 relative pl-2">
        <button
          onClick={() => navigate('/profile')}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 cursor-pointer text-sm font-medium"
        >
          <FaArrowLeft />
          <span>{t.back}</span>
        </button>
      </div>

      {/* Title */}
      <div className="text-center mb-6 mt-2 z-10 relative">
        <h1 className="text-3xl font-bold text-magical-gold text-glow">
          {t.title}
        </h1>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-lg flex flex-col items-center relative overflow-hidden text-gray-800">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-magical-purple to-magical-light"></div>

        {/* Group Name Banner */}
        <div className="w-full bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-xl p-4 text-center mb-6 shadow-md border border-purple-800/40 text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-white/5 text-7xl font-extrabold select-none">
            {userGroupName}
          </div>
          <div className="flex items-center justify-center gap-2 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <FaUsers /> {t.groupPrefix}
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 drop-shadow-sm tracking-wide">
            {userGroupName}
          </div>
        </div>

        {/* Schedule Cards */}
        <div className="w-full space-y-5">
          {/* Day 24 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:border-purple-300 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-base mb-2 border-b border-slate-200 pb-2">
              <FaCalendarAlt className="text-purple-600" />
              <span>{t.day24Title}</span>
            </div>
            <div className="space-y-1.5 text-sm pl-1">
              <div className="font-semibold text-gray-900">{t.day24Event}</div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FaClock className="text-gray-400" />
                <span>{t.day24Time}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 text-sm pt-1">
                <FaMapMarkerAlt className="text-rose-500 mt-0.5 shrink-0" />
                <span>{t.day24Loc}</span>
              </div>
              <div className="pt-2">
                <a
                  href="https://maps.app.goo.gl/aof7XDdYLioapv2H6?g_st=ic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  <FaMapMarkerAlt />
                  <span>{t.mapBtn}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Day 25 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:border-purple-300 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-base mb-2 border-b border-slate-200 pb-2">
              <FaCalendarAlt className="text-purple-600" />
              <span>{t.day25Title}</span>
            </div>
            <div className="space-y-1.5 text-sm pl-1">
              <div className="font-semibold text-gray-900">{t.day25Event}</div>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <FaClock className="text-gray-400" />
                <span>{t.day25Time}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 text-sm pt-1">
                <FaMapMarkerAlt className="text-rose-500 mt-0.5 shrink-0" />
                <span>{day25LocData[lang]}</span>
              </div>
              <div className="pt-2">
                <a
                  href={day25LocData.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  <FaMapMarkerAlt />
                  <span>{t.mapBtn}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Day 26 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:border-purple-300 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-base mb-2 border-b border-slate-200 pb-2">
              <FaCalendarAlt className="text-purple-600" />
              <span>{t.day26Title}</span>
            </div>
            <div className="space-y-1.5 text-sm pl-1">
              <div className="font-semibold text-gray-900">{t.day26Event}</div>
              <div className="text-sm text-gray-700 bg-purple-50 border border-purple-200 rounded-lg p-2.5 mt-2 flex items-center gap-1.5">
                <FaMapPin className="text-purple-500" />
                <span>{t.day26Note(deptDisplay)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Link Button */}
        <div className="w-full mt-6 pt-4 border-t border-gray-100 flex justify-center">
          <a
            href="https://www.instagram.com/samovidva_bangmod?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 active:scale-98 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-sm"
          >
            <span>{t.moreBtn}</span>
            <FaExternalLinkAlt className="text-xs" />
          </a>
        </div>
      </div>

      {/* Sponsors Section */}
      <SponsorsSection lang={lang} />
    </div>
  );
};

export default ActivityDetails;
