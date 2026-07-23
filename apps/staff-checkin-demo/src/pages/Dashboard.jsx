import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';
import { Shirt, CalendarCheck, FileText, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { staff, logout, lang } = useMockData();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTH = lang === 'TH';

  return (
    <div className="w-full flex flex-col items-center relative z-10 py-1 animate-fadeIn transition-all duration-300 ease-in-out">
      {/* Staff Status Bar */}
      <div className="w-full flex justify-between items-center mb-4 bg-black/20 p-3.5 rounded-xl backdrop-blur-sm border border-white/10">
        <div>
          <p className="text-white/60 text-[11px]">{isTH ? 'เข้าสู่ระบบโดย' : 'Logged in as'}</p>
          <p className="text-white text-xs sm:text-sm font-bold">{staff?.name}</p>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} />
          <span>{isTH ? 'ออกจากระบบ' : 'Log out'}</span>
        </button>
      </div>

      <div className="w-full space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-center mb-3 text-white text-glow">
          {isTH ? 'เมนูหลัก (สตาฟ)' : 'Main Menu (Staff)'}
        </h2>
        
        {/* Menu 1: Shirt Distribution */}
        <button 
          onClick={() => navigate('/scan?mode=shirt')}
          className="w-full glass-panel py-5 px-5 sm:py-6 sm:px-6 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group text-left"
        >
          <div className="bg-magical-light/20 p-3.5 rounded-2xl text-magical-light group-hover:scale-105 transition-transform shrink-0">
            <Shirt size={32} />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold block text-white">
              {isTH ? '1. เช็ครับเสื้อ' : '1. Shirt Distribution'}
            </span>
          </div>
        </button>

        {/* Menu 2: Daily Activity Check-in */}
        <button 
          onClick={() => navigate('/scan?mode=daily')}
          className="w-full glass-panel py-5 px-5 sm:py-6 sm:px-6 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group text-left"
        >
          <div className="bg-purple-500/20 p-3.5 rounded-2xl text-purple-300 group-hover:scale-105 transition-transform shrink-0">
            <CalendarCheck size={32} />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold block text-white">
              {isTH ? '2. ลงทะเบียนเข้าร่วมกิจกรรมรายวัน' : '2. Daily Event Registration'}
            </span>
          </div>
        </button>

        {/* Menu 3: Reports & Details */}
        <button 
          onClick={() => navigate('/report')}
          className="w-full glass-panel py-5 px-5 sm:py-6 sm:px-6 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group text-left"
        >
          <div className="bg-magical-gold/20 p-3.5 rounded-2xl text-magical-gold group-hover:scale-105 transition-transform shrink-0">
            <FileText size={32} />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold block text-white">
              {isTH ? '3. ดูรายชื่อ และรายละเอียดเพิ่มเติม' : '3. View Student List & Details'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
