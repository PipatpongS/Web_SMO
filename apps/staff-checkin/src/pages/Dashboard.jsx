import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, ROLES } from '../contexts/FirebaseDataContext';
import { Shirt, BarChart2, LogOut, ShieldCheck, User } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { staff, liffProfile, triggerLiffLogin, logout, lang } = useData();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTH = lang === 'TH';
  const isSupervisor = staff?.role === ROLES.SUPERVISOR;

  const displayName = liffProfile?.displayName || staff?.displayName || staff?.name || (isSupervisor ? 'Admin Staff' : 'Staff');
  const profilePic = liffProfile?.pictureUrl || staff?.pictureUrl || null;

  return (
    <div className="w-full max-w-md sm:max-w-lg flex flex-col items-center justify-center relative z-10 py-2 px-3 sm:px-4 animate-fadeIn transition-all duration-300 ease-in-out my-auto space-y-6 sm:space-y-8">
      
      {/* Staff Status Bar */}
      <div className="w-full bg-black/30 px-3 py-3 sm:px-4 sm:py-3.5 rounded-3xl backdrop-blur-md border border-white/15 shadow-xl mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-2">
          {/* Left: avatar + name + badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-purple-500/20 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border border-purple-400/30 text-purple-300 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {profilePic ? (
                <img src={profilePic} alt="LINE Profile" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-extrabold truncate leading-tight">{displayName}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border inline-block ${
                  isSupervisor 
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400/40' 
                    : 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                }`}>
                  {isSupervisor ? (isTH ? 'ผู้ดูแลระบบ' : 'Admin') : (isTH ? 'สตาฟฟ์' : 'Staff')}
                </span>

                {!liffProfile && (
                  <button 
                    onClick={triggerLiffLogin} 
                    className="text-[10px] px-2 py-0.5 rounded-md font-extrabold bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 border border-emerald-400/40 transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                    title={isTH ? "คลิกเพื่อดึงรูปและชื่อจาก LINE" : "Click to connect LINE profile"}
                  >
                    <span>🟢 {isTH ? 'เชื่อมต่อ LINE' : 'Connect LINE'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: logout button — icon only on mobile, icon+text on sm+ */}
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-1 text-red-300 hover:text-red-100 font-bold px-2.5 py-2 sm:px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 transition-all cursor-pointer shadow-sm shrink-0"
            title={isTH ? "ออกจากระบบ" : "Log out"}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline text-xs">{isTH ? 'ออกจากระบบ' : 'Log out'}</span>
          </button>
        </div>
      </div>

      {/* Main Menu Cards Container */}
      <div className="w-full space-y-4">
        <h2 className="text-base sm:text-lg font-black text-center text-white text-glow mb-2 uppercase tracking-wide">
          {isTH ? 'เลือกรายการเมนูสตาฟ' : 'Staff Action Menu'}
        </h2>
        
        {/* Menu 1: Shirt Distribution */}
        <button 
          onClick={() => navigate('/scan')}
          className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-amber-400/50 rounded-3xl"
        >
          <div className="bg-amber-400/20 p-3.5 rounded-2xl text-amber-300 group-hover:scale-110 transition-transform shrink-0 border border-amber-400/40 shadow-inner">
            <Shirt size={32} />
          </div>
          <div className="space-y-0.5">
            <span className="text-base sm:text-lg font-black block text-white group-hover:text-amber-200 transition-colors">
              {isTH ? '1. เช็ครับเสื้อ' : '1. Shirt Check-in'}
            </span>
            <span className="text-xs text-white/70 block font-medium">
              {isTH ? 'สแกน QR Code หรือพิมพ์ Short Code เพื่อเช็ครับเสื้อ' : 'Scan QR Code or Short Code for shirt check-in'}
            </span>
          </div>
        </button>

        {/* Menu 2: Stock & Summary Dashboard (Available for Admin/Supervisor) */}
        {isSupervisor && (
          <button 
            onClick={() => navigate('/stock-summary')}
            className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-emerald-400/50 rounded-3xl"
          >
            <div className="bg-emerald-500/20 p-3.5 rounded-2xl text-emerald-300 group-hover:scale-110 transition-transform shrink-0 border border-emerald-400/40 shadow-inner">
              <BarChart2 size={32} />
            </div>
            <div className="space-y-0.5">
              <span className="text-base sm:text-lg font-black block text-white group-hover:text-emerald-200 transition-colors">
                {isTH ? '2. Dashboard สรุปยอดและสต็อกเสื้อ' : '2. Stock Summary Dashboard'}
              </span>
              <span className="text-xs text-white/70 block font-medium">
                {isTH ? 'ดูรายงานสต็อกคงเหลือและการรับเสื้อ Real-time' : 'View real-time stock balance & distribution report'}
              </span>
            </div>
          </button>
        )}

      </div>
    </div>
  );
}
