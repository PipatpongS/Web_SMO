import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaCalendarAlt, FaMapMarkerAlt, FaPhoneAlt, FaUsers, FaInstagram, FaChevronDown, FaLine } from 'react-icons/fa';
import logoImg from '../assets/Logo.png';
import textHeaderImgThai from '../assets/text-header-thai.png';
import textHeaderImgEng from '../assets/text-header-eng.png';
import bImg from '../assets/b.png';
import LoadingScreen from '../components/LoadingScreen';
import { isBeforeRegistration, isAfterRegistration, REGISTRATION_START_DATE, isAfterStaffRegistration } from '../config/timeConfig';
import { useRegistration } from '../contexts/RegContext';
import { useStaffRegistration } from '../contexts/StaffRegContext';

const content = {
  TH: {
    langBtn: 'TH',
    registerBtn: 'ลงทะเบียนรอบพิเศษ',
    profileBtn: 'โปรไฟล์ของฉัน',
    staffProfileBtn: 'สถานะใบสมัคร Staff',
    detailsTitle: 'รายละเอียดงาน',
    targetTitle: 'สำหรับนักศึกษาคณะวิศวกรรมศาสตร์ \nชั้นปีที่ 1 (รหัส 69)',
    dateText: 'วันที่ 25 - 26 กรกฎาคม 2569',
    locationText: 'ณ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี',
    footerSub1: 'กิจกรรมปฐมนิเทศนักศึกษาใหม่',
    footerSub2: 'คณะวิศวกรรมศาสตร์ ปีการศึกษา 2569',
    contactTitle: 'ช่องทางการติดต่อ',
    lineChat: 'ไปที่ช่องแชท',
    igProfile: 'ไปที่โปรไฟล์',
    tapToCall: 'กดที่เบอร์',
    toCall: 'เพื่อโทร',
    contactName: '(สมชาย)',
    association: 'สโมสรนักศึกษาคณะวิศวกรรมศาสตร์'
  },
  EN: {
    langBtn: 'EN',
    registerBtn: 'Register for Event',
    profileBtn: 'My Profile',
    staffProfileBtn: 'Staff Application Status',
    detailsTitle: 'Event Details',
    targetTitle: 'For 1st Year Engineering Students \n(ID 69)',
    dateText: '25 - 26 July 2026',
    locationText: "King Mongkut's University of Technology Thonburi",
    footerSub1: 'Freshmen Orientation',
    footerSub2: 'Faculty of Engineering, Academic Year 2026',
    contactTitle: 'Contact Channels',
    lineChat: 'Chat Now',
    igProfile: 'View Profile',
    tapToCall: 'Tap to',
    toCall: 'Call',
    contactName: '(Somchai)',
    association: 'The Student Union of The Faculty of Engineering'
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { isRegistered: isParticipantRegistered, loading: regLoading } = useRegistration();
  const { isRegistered: isStaffRegistered, loading: staffLoading } = useStaffRegistration();
  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');
  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };
  const t = content[lang];

  const [showScrollArrow, setShowScrollArrow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;

      // If within 100px of the bottom, hide the arrow
      if (scrollHeight - scrollPosition < 100) {
        setShowScrollArrow(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Delay initial check to allow images to load and expand the document height
    const timer = setTimeout(handleScroll, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-4 pb-6 -mt-0 text-white overflow-x-hidden relative">
      {/* Bow Image Fixed at Top-Left */}
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" />

      {/* Top Section Wrapper to push everything up */}
      <div className="w-full max-w-lg flex flex-col items-center">

        {/* Logos & Header Section */}
        <div className="w-full flex justify-center sm:justify-start items-center -mt-4 mb-4 relative z-10 min-h-[4rem]">
          <div className="flex items-center z-10">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-24 sm:h-32 md:h-36 object-contain drop-shadow-lg" />
          </div>
          <div className="absolute right-0 z-20">
            <button onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer">
              <span className="mr-1">🌐</span> <span className="w-6 text-center inline-block">{t.langBtn}</span>
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center -mb-1 -mt-12 w-full flex justify-center">
          <img src={lang === 'TH' ? textHeaderImgThai : textHeaderImgEng} alt="Header" className="w-[100vw] max-w-[450px] object-contain drop-shadow-lg mb-4" />
        </div>

        <div className="w-full flex flex-col items-center">
          {(regLoading || staffLoading) ? (
            <button
              disabled
              className="w-full max-w-[250px] mx-auto text-[14px] py-2 flex justify-center items-center mb-12 min-h-[40px] bg-gray-500/50 rounded-full border border-white/20 cursor-not-allowed"
            >
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
            </button>
          ) : isStaffRegistered ? (
            <button
              onClick={() => navigate('/staff/profile')}
              className="w-full max-w-[250px] mx-auto text-[14px] py-2 flex justify-center items-center space-x-2 mb-12 min-h-[40px] glass-button"
            >
              <span>{t.staffProfileBtn}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (isParticipantRegistered) {
                  navigate('/profile');
                } else if (!isBeforeRegistration() && !isAfterRegistration()) {
                  navigate('/register');
                }
              }}
              className={`w-full max-w-[250px] mx-auto text-[14px] py-2 flex justify-center items-center space-x-2 mb-12 min-h-[40px] ${(!isParticipantRegistered && (isBeforeRegistration() || isAfterRegistration()))
                ? 'bg-gray-500/50 cursor-not-allowed rounded-full border border-white/20'
                : 'glass-button'
                }`}
              disabled={!isParticipantRegistered && (isBeforeRegistration() || isAfterRegistration())}
            >
              <span>
                {isParticipantRegistered
                  ? t.profileBtn
                  : isBeforeRegistration()
                    ? (lang === 'TH' ? `เปิดรับสมัคร ${new Date(REGISTRATION_START_DATE).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : `Opens ${new Date(REGISTRATION_START_DATE).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`)
                    : isAfterRegistration()
                      ? (lang === 'TH' ? 'ปิดรับลงทะเบียนแล้ว' : 'Registration Closed')
                      : t.registerBtn}
              </span>
            </button>
          )}
        </div>

        {/* Activity Details Card */}
        <div className="glass-panel p-5 sm:p-6 w-full max-w-lg mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 border border-white/20 px-5 py-1.5 rounded-full text-[13px] sm:text-sm font-medium tracking-wide">
              {t.detailsTitle}
            </div>
          </div>

          <div className="flex flex-col space-y-4 sm:space-y-5">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-magical-gold">
                <FaGraduationCap size={18} />
              </div>
              <div className="text-[13px] sm:text-[14px] text-white/90 leading-snug whitespace-pre-line">{t.targetTitle}</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-magical-gold">
                <FaCalendarAlt size={16} />
              </div>
              <div className="text-[13px] sm:text-[14px] text-white/90 leading-snug">{t.dateText}</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-magical-gold">
                <FaMapMarkerAlt size={16} />
              </div>
              <div className="text-[13px] sm:text-[14px] text-white/90 leading-snug">{t.locationText}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Contact Section (Pushed to bottom by justify-between) */}
      <div className="glass-panel p-6 sm:p-8 w-full max-w-lg text-center">
        <h2 className="text-2xl font-extrabold mb-1 bg-gradient-to-r from-magical-gold to-yellow-200 bg-clip-text text-transparent drop-shadow-md">SMO VIDVA</h2>
        <p className="text-sm text-white/80 mb-8 font-light leading-relaxed">{t.footerSub1}<br />{t.footerSub2}</p>

        <div className="border-t border-white/10 pt-8 mb-6 flex justify-center w-full">
          <div className="bg-white/10 border border-white/20 px-6 py-2 rounded-full text-sm flex items-center space-x-2 text-white/90">
            <span>{t.contactTitle}</span>
          </div>
        </div>

        {/* Contact Info Group */}
        <div className="flex flex-col space-y-4 mb-8">
          {/* LINE Contact */}
          <a href="https://line.me/R/ti/p/@122ddost" target="_blank" rel="noreferrer" className="group flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 pr-1 sm:pr-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-[#00B900] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FaLine className="text-[22px] sm:text-[28px]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider mb-0.5">LINE Official</div>
                <div className="text-[11px] sm:text-[13px] font-medium text-white/90 group-hover:text-white transition-colors tracking-tighter">SMO VIDVA BANGMOD</div>
              </div>
            </div>
            <div className="text-[10px] sm:text-xs bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white/80 group-hover:bg-[#00B900] group-hover:text-white transition-all shrink-0">{t.lineChat}</div>
          </a>

          {/* Instagram Contact */}
          <a href="https://instagram.com/samovidva_bangmod" target="_blank" rel="noreferrer" className="group flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 pr-1 sm:pr-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FaInstagram className="text-[20px] sm:text-[24px]" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Instagram</div>
                <div className="text-[11px] sm:text-[13px] font-medium text-white/90 group-hover:text-white transition-colors tracking-tighter uppercase">samovidva_bangmod</div>
              </div>
            </div>
            <div className="text-[10px] sm:text-xs bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white/80 group-hover:bg-[#bc1888] group-hover:text-white transition-all shrink-0">{t.igProfile}</div>
          </a>
        </div>

        <div className="flex flex-col items-center border-t border-white/10 pt-6 mb-6">
          <img src="/icon.png" alt="SMO Icon" className="w-14 h-10 object-contain mb-3 drop-shadow-lg" />
          <span className="text-sm font-medium tracking-wide text-white/90 text-center leading-snug">{t.association}</span>
        </div>

        <div className="text-[10px] text-white/40 tracking-widest uppercase text-center mb-6">
          <div className="mb-1">Designed & Developed</div>
          <div className="font-medium text-white/50">Pipatpong Saptharanon</div>
        </div>

        <div className="flex flex-col items-center space-y-2 text-[10px] sm:text-[11px] text-white/40 tracking-wider pb-4">
          <div className="text-center leading-relaxed">
            © 2026 The Student Union of The Faculty of Engineering. All rights reserved.
          </div>
          <div className="flex flex-col items-center space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <span>Version 1.2.2</span>
            </div>
          </div>
        </div>
      </div>

      {!regLoading && !staffLoading && !isParticipantRegistered && !isStaffRegistered && !isAfterStaffRegistration() && (
        <div className="w-full max-w-lg mt-8 flex justify-center z-20 relative pb-12">
          <button
            onClick={() => navigate('/staff')}
            className="w-[90%] max-w-[300px] text-[14px] sm:text-[15px] font-bold py-3 px-6 rounded-3xl bg-white/10 backdrop-blur-md border border-yellow-300/40 shadow-[0_0_20px_rgba(255,215,0,0.15)] text-magical-gold hover:text-yellow-100 hover:bg-white/20 hover:scale-105 transition-all duration-300 flex flex-col justify-center items-center tracking-wide text-center leading-snug"
          >
            {lang === 'TH' ? (
              <>คลิกที่นี่ เพื่อสมัครเป็น Staff<br />สำหรับงานนี้เท่านั้น</>
            ) : (
              <>Click here to Apply for Staff<br />for this event only</>
            )}
          </button>
        </div>
      )}

      {/* Fixed Scroll Indicator via Portal */}
      {createPortal(
        <div
          className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-[100] transition-opacity duration-500 pointer-events-none ${showScrollArrow ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="animate-bounce text-white/80 p-2 drop-shadow-lg">
            <FaChevronDown size={20} />
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Home;
