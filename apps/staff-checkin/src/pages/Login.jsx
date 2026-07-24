import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { Lock, User, KeyRound, MessageCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, triggerLiffLogin, liffProfile, lang, staff } = useData();
  const navigate = useNavigate();

  const isTH = lang === 'TH';

  useEffect(() => {
    if (staff) {
      navigate('/home', { replace: true });
    }
  }, [staff, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/home');
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

        {/* LINE Profile Indicator */}
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
              <CheckCircle2 size={12} /> {isTH ? 'เชื่อม LINE แล้ว' : 'LINE Connected'}
            </span>
          </div>
        ) : null}
        
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
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-semibold transition-all"
              placeholder={isTH ? 'กรอกไอดี' : 'Enter Username'}
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
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-semibold transition-all"
              placeholder={isTH ? 'กรอกรหัสผ่าน' : 'Enter Password'}
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
            disabled={isSubmitting}
            className="w-full glass-button mt-4 py-3 text-sm font-extrabold cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-lg text-white bg-purple-600/50 hover:bg-purple-600/70 border border-purple-400/40 rounded-xl"
          >
            {isSubmitting ? (isTH ? 'กำลังเข้าสู่ระบบ...' : 'Logging in...') : (isTH ? 'เข้าสู่ระบบ' : 'Login')}
          </button>
        </form>
      </div>
    </div>
  );
}
