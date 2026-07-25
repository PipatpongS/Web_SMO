import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, ROLES } from '../contexts/FirebaseDataContext';
import { Shirt, BarChart2, LogOut, ShieldCheck, User, UserCheck, ClipboardCheck } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { staff, liffProfile, logout, lang, formatDepartment } = useData();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTH = lang === 'TH';
  const isSupervisor = staff?.role === ROLES.SUPERVISOR;
  const isWalkinOperator = staff?.role === ROLES.WALKIN_OPERATOR;
  const isShirtOperator = staff?.role === ROLES.SHIRT_OPERATOR;
  const isCheckinOperator = staff?.role === ROLES.CHECKIN_OPERATOR;

  const canDoWalkin = isSupervisor || isWalkinOperator || isCheckinOperator;
  const canDoShirt = isSupervisor || isShirtOperator;
  const canDoCheckin = isSupervisor || isCheckinOperator || isWalkinOperator;

  const displayName = liffProfile?.displayName || staff?.displayName || staff?.name || (isSupervisor ? 'Admin Staff' : 'Staff');
  const profilePic = liffProfile?.pictureUrl || staff?.pictureUrl || null;

  const getRoleLabel = () => {
    if (isSupervisor) return isTH ? 'ผู้ดูแลระบบ (Admin)' : 'Admin';
    if (staff?.department) {
      const deptName = formatDepartment ? formatDepartment(staff.department, isTH) : staff.department;
      return isTH ? `สตาฟภาควิชา ${deptName}` : `Department Staff (${deptName})`;
    }
    if (isWalkinOperator) return isTH ? 'สตาฟอนุมัติ Walk-in' : 'Walk-in Operator';
    if (isShirtOperator) return isTH ? 'สตาฟตรวจแจกเสื้อ' : 'Shirt Operator';
    if (isCheckinOperator) return isTH ? 'สตาฟเช็คชื่อลงทะเบียน' : 'Registration Check-in Operator';
    return isTH ? 'สตาฟ' : 'Staff';
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg flex flex-col items-center justify-center relative z-10 py-1 px-3 sm:px-4 animate-fadeIn transition-all duration-300 ease-in-out my-auto space-y-4 sm:space-y-6">

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
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-extrabold border inline-block ${isSupervisor
                  ? 'bg-purple-500/30 text-purple-200 border-purple-400/40'
                  : staff?.department
                    ? 'bg-amber-400/25 text-amber-200 border-amber-400/50'
                    : isWalkinOperator
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                      : isCheckinOperator
                        ? 'bg-teal-500/30 text-teal-200 border-teal-400/40'
                        : 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                  }`}>
                  {getRoleLabel()}
                </span>
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
      <div className="w-full space-y-3.5">
        <h2 className="text-base sm:text-lg font-black text-center text-white text-glow mb-2 uppercase tracking-wide">
          {isTH ? 'เลือกรายการเมนูสตาฟ' : 'Staff Action Menu'}
        </h2>

        {/* Menu 1: Registration Check-in (เช็คชื่อลงทะเบียน) */}
        {canDoCheckin && (
          <button
            onClick={() => navigate('/scan?mode=checkin')}
            className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-teal-400/50 rounded-3xl"
          >
            <div className="bg-teal-500/20 p-3.5 rounded-2xl text-teal-300 group-hover:scale-110 transition-transform shrink-0 border border-teal-400/40 shadow-inner">
              <ClipboardCheck size={30} />
            </div>
            <div className="space-y-0.5">
              <span className="text-base sm:text-lg font-black block text-white group-hover:text-teal-200 transition-colors">
                {isTH ? '1. เช็คชื่อลงทะเบียน' : '1. Registration Check-in'}
              </span>
              <span className="text-xs text-white/70 block font-medium leading-relaxed">
                {isTH
                  ? 'สแกน QR Code, Short Code หรือรหัสนักศึกษา เพื่อเช็คชื่อเข้าร่วม'
                  : 'Scan QR Code, Short Code, or Student ID to record attendance'}
              </span>
            </div>
          </button>
        )}

        {/* Menu 2: Registration Statistics & Directory (ดูสถิติการลงทะเบียน) */}
        <button
          onClick={() => navigate('/checkin-report')}
          className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-blue-400/50 rounded-3xl"
        >
          <div className="bg-blue-500/20 p-3.5 rounded-2xl text-blue-300 group-hover:scale-110 transition-transform shrink-0 border border-blue-400/40 shadow-inner">
            <BarChart2 size={30} />
          </div>
          <div className="space-y-0.5">
            <span className="text-base sm:text-lg font-black block text-white group-hover:text-blue-200 transition-colors">
              {isTH ? '2. ดูสถิติและรายชื่อการลงทะเบียน' : '2. Registration Statistics & Directory'}
            </span>
            <span className="text-xs text-white/70 block font-medium leading-relaxed">
              {isTH
                ? 'ดูยอดรวมและค้นหารายชื่อเฉพาะภาควิชา'
                : 'View stats and search directory for your department'}
            </span>
          </div>
        </button>

        {/* Menu 3: Walk-in Registration Approval (อนุมัติการลงทะเบียนสำหรับ Walk-in) */}
        {canDoWalkin && (
          <button
            onClick={() => navigate('/scan?mode=walkin')}
            className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-amber-400/50 rounded-3xl"
          >
            <div className="bg-amber-400/20 p-3.5 rounded-2xl text-amber-300 group-hover:scale-110 transition-transform shrink-0 border border-amber-400/40 shadow-inner">
              <UserCheck size={30} />
            </div>
            <div className="space-y-0.5">
              <span className="text-base sm:text-lg font-black block text-white group-hover:text-amber-200 transition-colors">
                {isTH ? '3. อนุมัติการลงทะเบียน (สำหรับ Walk-in)' : '3. Walk-in Registration Approval'}
              </span>
              <span className="text-xs text-white/70 block font-medium leading-relaxed">
                {isTH
                  ? 'สแกน QR Code หรือค้นหารายชื่อ เพื่ออนุมัติการลงทะเบียนหน้างาน'
                  : 'Scan QR Code or search student to approve walk-in registration'}
              </span>
            </div>
          </button>
        )}

        {/* Shirt Check-in Menu */}
        {canDoShirt && (
          <button
            onClick={() => navigate('/scan?mode=shirt')}
            className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-purple-400/50 rounded-3xl"
          >
            <div className="bg-purple-500/20 p-3.5 rounded-2xl text-purple-300 group-hover:scale-110 transition-transform shrink-0 border border-purple-400/40 shadow-inner">
              <Shirt size={30} />
            </div>
            <div className="space-y-0.5">
              <span className="text-base sm:text-lg font-black block text-white group-hover:text-purple-200 transition-colors">
                {isTH ? 'เช็ครับเสื้อ' : 'Shirt Check-in'}
              </span>
              <span className="text-xs text-white/70 block font-medium leading-relaxed">
                {isTH ? 'สแกน QR Code หรือพิมพ์ Short Code เพื่อเช็ครับเสื้อและบันทึกข้อมูล' : 'Scan QR Code or Short Code for shirt check-in'}
              </span>
            </div>
          </button>
        )}
        {/* Stock & Summary Dashboard (Available for Admin/Supervisor) */}
        {isSupervisor && (
          <button
            onClick={() => navigate('/stock-summary')}
            className="w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 hover:border-emerald-400/50 rounded-3xl"
          >
            <div className="bg-emerald-500/20 p-3.5 rounded-2xl text-emerald-300 group-hover:scale-110 transition-transform shrink-0 border border-emerald-400/40 shadow-inner">
              <BarChart2 size={30} />
            </div>
            <div className="space-y-0.5">
              <span className="text-base sm:text-lg font-black block text-white group-hover:text-emerald-200 transition-colors">
                {isTH ? 'Dashboard สรุปยอดและสต็อกเสื้อ' : 'Stock Summary Dashboard'}
              </span>
              <span className="text-xs text-white/70 block font-medium leading-relaxed">
                {isTH ? 'ดูรายงานสต็อกคงเหลือและการรับเสื้อ Real-time' : 'View real-time stock balance & distribution report'}
              </span>
            </div>
          </button>
        )}

      </div>
    </div>
  );
}
