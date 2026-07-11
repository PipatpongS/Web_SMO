import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaLine, FaInstagram, FaUsers, FaHeartbeat, FaRunning, FaTools, FaCamera } from 'react-icons/fa';
import { useStaffRegistration } from '../contexts/StaffRegContext';
import logoImg from '../assets/Logo.png';
import textHeaderImgThai from '../assets/text-header-thai.png';
import textHeaderImgEng from '../assets/text-header-eng.png';
import bImg from '../assets/b.png';

const content = {
  TH: {
    langBtn: 'TH',
    registerBtn: 'สมัครเป็น Staff',
    statusBtn: 'สถานะใบสมัคร Staff',
    detailsTitle: 'เปิดรับสมัคร Staff 4 ฝ่าย',
    footerSub1: 'กิจกรรมปฐมนิเทศนักศึกษาใหม่',
    footerSub2: 'คณะวิศวกรรมศาสตร์ ปีการศึกษา 2569',
    contactTitle: 'ช่องทางการติดต่อ',
    lineChat: 'ไปที่ช่องแชท',
    igProfile: 'ไปที่โปรไฟล์',
    association: 'สโมสรนักศึกษาคณะวิศวกรรมศาสตร์'
  },
  EN: {
    langBtn: 'EN',
    registerBtn: 'Apply for Staff',
    statusBtn: 'Staff Application Status',
    detailsTitle: 'Staff Recruitment - 4 Roles',
    footerSub1: 'Freshmen Orientation',
    footerSub2: 'Faculty of Engineering, Academic Year 2026',
    contactTitle: 'Contact Channels',
    lineChat: 'Chat Now',
    igProfile: 'View Profile',
    association: 'The Student Union of The Faculty of Engineering'
  }
};

const StaffHome = () => {
  const navigate = useNavigate();
  const { isRegistered, loading: regLoading } = useStaffRegistration();
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

      if (scrollHeight - scrollPosition < 100) {
        setShowScrollArrow(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    const timer = setTimeout(handleScroll, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 pb-6 pt-12 text-white overflow-x-hidden relative">
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" />

      {/* Back Button */}
      <div className="w-full max-w-lg mb-6 flex justify-start z-10 relative pl-2">
        <button
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 cursor-pointer drop-shadow-md"
        >
          <span className="text-xl">←</span>
          <span>{lang === 'TH' ? 'กลับหน้าหลัก' : 'Back to Home'}</span>
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center">
        <div className="glass-panel p-5 sm:p-6 w-full max-w-lg mb-8 text-left">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 border border-white/20 px-5 py-1.5 rounded-full text-[13px] sm:text-sm font-medium tracking-wide">
              {t.detailsTitle}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/95 border border-white/50 shadow-md rounded-xl p-4 transition-transform hover:-translate-y-1">
              <h3 className="font-bold text-[#1e3a5f] text-lg flex items-center mb-2"><FaHeartbeat className="mr-2 text-red-500"/> ฝ่ายพยาบาล (10 คน)</h3>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>วันที่:</strong> 26 กรกฎาคม 2569</p>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>หน้าที่:</strong> แจกไม้แอมโมเนียให้น้อง และส่งต่อน้องให้ EMS</p>
              <p className="text-[13px] sm:text-sm text-red-600"><strong>หมายเหตุ:</strong> ไม่จำเป็นต้องมีบัตรพยาบาล</p>
            </div>

            <div className="bg-white/95 border border-white/50 shadow-md rounded-xl p-4 transition-transform hover:-translate-y-1">
              <h3 className="font-bold text-[#1e3a5f] text-lg flex items-center mb-2"><FaRunning className="mr-2 text-orange-500"/> ฝ่ายกิจกรรม (40 คน)</h3>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</p>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>หน้าที่:</strong> จัดกิจกรรมให้น้อง ๆ, นำวิ่งรับเกียร์, ทำกิจกรรมบูมต้อนรับ</p>
              <p className="text-[13px] sm:text-sm text-orange-600"><strong>หมายเหตุ:</strong> มีการซ้อมกิจกรรมวันที่ 21 และ 23 กรกฏาคม 2569</p>
            </div>

            <div className="bg-white/95 border border-white/50 shadow-md rounded-xl p-4 transition-transform hover:-translate-y-1">
              <h3 className="font-bold text-[#1e3a5f] text-lg flex items-center mb-2"><FaTools className="mr-2 text-slate-500"/> ฝ่ายสถานที่และสวัสดิการ (10 คน)</h3>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</p>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>หน้าที่:</strong> ช่วยเคลื่อนย้าย จัดวางอุปกรณ์ต่างๆ, แจกอาหารว่างและเครื่องดื่ม, หน้าที่อื่นๆ ที่ได้รับมอบหมาย</p>
              <p className="text-[13px] sm:text-sm text-orange-600"><strong>หมายเหตุ:</strong> มีการนัดหมายจัดสถานที่ วันที่ 24 กรกฎาคม 2569</p>
            </div>

            <div className="bg-white/95 border border-white/50 shadow-md rounded-xl p-4 transition-transform hover:-translate-y-1">
              <h3 className="font-bold text-[#1e3a5f] text-lg flex items-center mb-2"><FaCamera className="mr-2 text-blue-500"/> ประชาสัมพันธ์ (3 คน)</h3>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>วันที่:</strong> 25 - 26 กรกฎาคม 2569</p>
              <p className="text-[13px] sm:text-sm text-gray-700 mb-1"><strong>หน้าที่:</strong> เก็บบรรยากาศภายในกิจกรรม, จัดทำคลิป และเนื้อหาประชาสัมพันธ์ เผยแพร่ผ่านช่องทางออนไลน์, หน้าที่อื่นๆ ที่ได้รับมอบหมาย</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center mt-2">
        <button
          onClick={() => navigate(isRegistered ? '/staff/profile' : '/staff/register')}
          className="w-full max-w-[250px] mx-auto text-[15px] font-bold py-3 flex justify-center items-center space-x-2 mb-12 glass-button shadow-lg hover:scale-105 transition-transform"
        >
          <span>{isRegistered ? t.statusBtn : t.registerBtn}</span>
        </button>
      </div>

    </div>
  );
};

export default StaffHome;
