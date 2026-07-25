import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { Lock, User, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, triggerLiffLogin, liffProfile, liffLoading, logout, lang, staff } = useData();
  const navigate = useNavigate();

  const isTH = lang === 'TH';

  useEffect(() => {
    if (staff && liffProfile) {
      navigate('/home', { replace: true });
    } else if (staff && !liffProfile && !liffLoading) {
      logout();
      setError(isTH 
        ? 'การเชื่อมต่อ LINE หลุดออกจากระบบ กรุณายืนยันตัวตนด้วย LINE ใหม่อีกครั้งเพื่อความปลอดภัย' 
        : 'LINE Session Disconnected. Please re-authenticate with LINE for security.');
    }
  }, [staff, liffProfile, liffLoading, navigate, logout, isTH]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!liffProfile) {
      setError(isTH ? 'ไม่อนุญาตให้เข้าสู่ระบบ: ต้องยืนยันตัวตนด้วย LINE ก่อนเท่านั้นเพื่อความปลอดภัย' : 'Login rejected: Must authenticate with LINE first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(username, password);
      if (res && res.success) {
        navigate('/home');
      } else if (res && res.reason === 'NO_LINE_PROFILE') {
        setError(isTH ? 'ไม่พบข้อมูลการยืนยันตัวตนด้วย LINE กรุณากดปุ่มเชื่อมต่อ LINE ด้านบนก่อน' : 'LINE profile missing. Please authenticate with LINE first.');
      } else {
        setError(isTH ? 'ไอดีหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid ID or Password');
      }
    } catch (err) {
      setError(isTH ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' : 'Login system error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center relative z-10 my-auto animate-fadeIn">
      <div className="glass-panel p-6 sm:p-8 w-full max-w-sm sm:max-w-md shadow-2xl border border-white/20 rounded-3xl">
        
        <div className="text-center mb-6 space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30 mb-2 shadow-inner">
            <Lock size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-center text-white text-glow">
            {isTH ? 'เข้าสู่ระบบสตาฟ' : 'Staff Login'}
          </h2>
          <p className="text-xs text-white/70 font-medium">
            {isTH ? 'กรอกไอดีและรหัสผ่านเพื่อเข้าใช้งาน' : 'Enter your ID and Password to access staff portal'}
          </p>
        </div>

        {/* LINE Profile Status Indicator */}
        {liffProfile ? (
          <div className="mb-4 p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-between gap-2 text-xs text-emerald-200">
            <div className="flex items-center gap-2 min-w-0">
              {liffProfile.pictureUrl ? (
                <img src={liffProfile.pictureUrl} alt="LINE" className="w-7 h-7 rounded-full object-cover border border-emerald-300 shrink-0" />
              ) : (
                <User size={16} className="text-emerald-300" />
              )}
              <span className="font-bold truncate">{liffProfile.displayName}</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded-md font-black shrink-0">
              <CheckCircle2 size={12} /> {isTH ? 'ยืนยัน LINE แล้ว' : 'LINE Verified'}
            </span>
          </div>
        ) : (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 space-y-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-extrabold">{isTH ? 'ยังไม่ได้ยืนยันตัวตนด้วย LINE' : 'LINE Profile Required'}</p>
                <p className="text-[11px] text-amber-200/80 leading-tight">
                  {isTH ? 'กดปุ่มด้านล่างเพื่อยืนยันตัวตนด้วย LINE ก่อนเข้าสู่ระบบ' : 'Click button below to authenticate with LINE first'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await triggerLiffLogin();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>💬 {isTH ? 'ยืนยันตัวตนด้วย LINE (LINE Login)' : 'Authenticate with LINE'}</span>
            </button>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white/90 mb-1.5 flex items-center gap-1.5">
              <User size={15} className="text-purple-300" />
              <span>{isTH ? 'ไอดี' : 'Username'}</span>
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-semibold transition-all disabled:opacity-50"
              placeholder={isTH ? 'กรอกไอดี' : 'Enter Username'}
              disabled={!liffProfile}
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-white/90 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={15} className="text-purple-300" />
              <span>{isTH ? 'รหัสผ่าน' : 'Password'}</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-semibold transition-all disabled:opacity-50"
              placeholder={isTH ? 'กรอกรหัสผ่าน' : 'Enter Password'}
              disabled={!liffProfile}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-bold text-center">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting || !liffProfile}
            className={`w-full glass-button mt-4 py-3 text-sm font-extrabold cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-lg border rounded-xl ${
              !liffProfile 
                ? 'bg-gray-600/30 text-white/50 border-gray-500/30 cursor-not-allowed hover:scale-100 active:scale-100'
                : 'bg-purple-600/50 hover:bg-purple-600/70 text-white border-purple-400/40'
            }`}
          >
            {!liffProfile 
              ? (isTH ? 'ต้องเข้าผ่านแอป LINE เท่านั้น' : 'Must open via LINE App') 
              : isSubmitting 
                ? (isTH ? 'กำลังเข้าสู่ระบบ...' : 'Logging in...') 
                : (isTH ? 'เข้าสู่ระบบ' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  );
}
