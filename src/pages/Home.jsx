import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaCalendarAlt, FaMapMarkerAlt, FaPhoneAlt, FaUsers, FaInstagram } from 'react-icons/fa';
import logoImg from '../assets/Logo.png';
import textHeaderImg from '../assets/text-header.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-4 pb-6 -mt-4 text-white overflow-x-hidden relative">

      {/* Top Section Wrapper to push everything up */}
      <div className="w-full max-w-md flex flex-col items-center">

        {/* Logos & Header Section */}
        <div className="w-full flex justify-between items-center -mt-4 mb-4">
          <div className="flex items-center">
            <img src={logoImg} alt="KMUTT ENG Logo" className="h-36 object-contain drop-shadow-lg" />
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm flex items-center">
            <span className="mr-1">🌐</span> TH
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-0 -mt-16 w-full flex justify-center">
          <img src={textHeaderImg} alt="กิจกรรมปฐมนิเทศนักศึกษาใหม่ คณะวิศวกรรมศาสตร์ ปีการศึกษา 2569" className="w-[115vw] max-w-[600px] object-contain drop-shadow-lg mb-4" />
        </div>

        <div>
          <button
            onClick={() => navigate('/register')}
            className="glass-button w-full max-w-[256px] mx-auto text-lg flex justify-center items-center space-x-2 mb-12"
          >
            <span>ลงทะเบียนเข้าร่วมงาน</span>
          </button>
        </div>

        {/* Details Section */}
        <div className="glass-panel p-6 w-full max-w-md mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-magical-purple/50 border border-magical-light/50 px-6 py-2 rounded-full text-glow font-semibold flex items-center space-x-2">

              <span>รายละเอียดงาน</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-magical-gold">
                <FaGraduationCap size={20} />
              </div>
              <div className="text-sm">สำหรับนักศึกษาคณะวิศวกรรมศาสตร์ชั้นปีที่ 1 (รหัส 69)</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-magical-gold">
                <FaCalendarAlt size={20} />
              </div>
              <div className="text-sm">วันที่ 26 - 27 กรกฎาคม 2569</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-magical-gold">
                <FaMapMarkerAlt size={20} />
              </div>
              <div className="text-sm">ณ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Contact Section (Pushed to bottom by justify-between) */}
      <div className="glass-panel p-4 w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-2 text-magical-gold">SMO VIDVA</h2>
        <p className="text-xs text-white/80 mb-4">กิจกรรมปฐมนิเทศนักศึกษาใหม่ คณะวิศวกรรมศาสตร์ ปีการศึกษา 2569</p>

        <div className="flex justify-center mb-6">
          <div className="bg-white/10 border border-white/20 px-6 py-2 rounded-full text-sm flex items-center space-x-2">
            <FaPhoneAlt />
            <span>ติดต่อเรา</span>
          </div>
        </div>

        <div className="flex justify-around items-center text-sm mb-6">
          <div className="flex flex-col items-center">
            <FaInstagram size={28} className="mb-2 text-magical-gold" />
            <span className="text-xs">samovidva_bangmod</span>
          </div>
          <div className="flex flex-col space-y-2 text-xs">
            <div className="flex items-center space-x-2"><FaPhoneAlt className="text-magical-gold" /><span>093 322 3232 (สมชาย)</span></div>
            <div className="flex items-center space-x-2"><FaPhoneAlt className="text-magical-gold" /><span>093 322 3232 (สมชาย)</span></div>
          </div>
        </div>

        <div className="flex flex-col items-center border-b border-white/20 pb-6 mb-6">
          <FaUsers size={24} className="mb-2 text-magical-gold" />
          <span className="text-sm">สโมสรนักศึกษาคณะวิศวกรรมศาสตร์</span>
        </div>

        <div className="text-xs text-white/60">
          <div>Designed & Developed</div>
          <div>Pipatpong Saptharanon</div>
        </div>
      </div>

    </div>
  );
};

export default Home;
