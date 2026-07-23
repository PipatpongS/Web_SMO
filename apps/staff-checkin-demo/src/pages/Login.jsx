import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const { login, lang } = useMockData();
  const navigate = useNavigate();

  const isTH = lang === 'TH';

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError(isTH ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ใช้ admin / admin)' : 'Invalid username or password (use admin / admin)');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 relative z-10">
      <div className="glass-panel p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-white text-glow">
          {isTH ? 'เข้าสู่ระบบสตาฟ (Demo)' : 'Staff Login (Demo)'}
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-white/90 mb-1">
              {isTH ? 'ชื่อผู้ใช้' : 'Username'}
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-magical-light text-sm"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-white/90 mb-1">
              {isTH ? 'รหัสผ่าน' : 'Password'}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-magical-light text-sm"
              placeholder="admin"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs sm:text-sm">{error}</p>}
          <button type="submit" className="w-full glass-button mt-4">
            {isTH ? 'เข้าสู่ระบบ' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
