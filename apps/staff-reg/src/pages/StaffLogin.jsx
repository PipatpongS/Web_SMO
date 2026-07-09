import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaArrowRight } from 'react-icons/fa';
import logoImg from '../assets/Logo.png';
import bImg from '../assets/b.png';

const StaffLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('กรุณากรอก Username และ Password ให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setError('');

    const credentials = btoa(`${username}:${password}`);

    try {
      // Test the password against the backend API (without fetching stats)
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        // Password is correct, store in sessionStorage
        sessionStorage.setItem('staff_auth', credentials);
        navigate('/staff/dashboard');
      } else {
        const errData = await response.json();
        setError('ข้อมูลไม่ถูกต้อง หรือ ' + (errData.error || 'การเชื่อมต่อผิดพลาด'));
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-6 text-white relative">
      <img src={bImg} alt="Bow" className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none opacity-50" />
      
      <div className="w-full max-w-sm flex flex-col items-center z-10">
        <img src={logoImg} alt="Logo" className="h-28 object-contain mb-8 drop-shadow-lg" />
        
        <div className="glass-panel w-full p-8 rounded-3xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-magical-gold mb-4">
            <FaLock size={20} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Staff Portal</h2>
          <p className="text-sm text-white/60 mb-6">กรุณากรอกข้อมูลเข้าสู่ระบบสำหรับทีมงาน</p>

          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                <FaUser />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-magical-gold focus:ring-1 focus:ring-magical-gold transition-all"
                autoFocus
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                <FaLock />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-magical-gold focus:ring-1 focus:ring-magical-gold transition-all"
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 py-2 px-3 rounded-lg border border-red-400/20 text-left">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all mt-2
                ${loading ? 'bg-white/10 cursor-not-allowed' : 'bg-magical-gold text-black hover:bg-yellow-400 active:scale-95'}`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <FaArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
