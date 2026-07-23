import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';
import { ArrowLeft, Search, Camera } from 'lucide-react';

export default function ScanInput() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'all'; // 'shirt' | 'daily' | 'all'
  const { findStudentByCode, students, lang } = useMockData();

  const isTH = lang === 'TH';

  // Initialize Real Camera Feed
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('getUserMedia is not supported on insecure HTTP connections over IP');
          setCameraActive(false);
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.log('Camera access not available or denied:', err);
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Strict Short Code Formatter: Exactly 2 Uppercase Letters + 2 Digits (e.g. AB12, CP01)
  const handleCodeChange = (e) => {
    setError('');
    const raw = e.target.value.toUpperCase();
    let letters = '';
    let digits = '';

    for (let char of raw) {
      if (letters.length < 2) {
        if (/[A-Z]/.test(char)) {
          letters += char;
        }
      } else if (digits.length < 2) {
        if (/[0-9]/.test(char)) {
          digits += char;
        }
      }
    }

    setCode((letters + digits).slice(0, 4));
  };

  const executeSearch = (searchCode) => {
    const targetCode = searchCode.trim() || 'CP01';
    const student = findStudentByCode(targetCode) || students[0];
    
    if (student) {
      navigate(`/student/${student.id}?mode=${mode}`);
    } else {
      setError(isTH ? 'ไม่พบข้อมูลด้วย Short Code นี้' : 'Student not found with this Short Code');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(code);
  };

  const handleMockScanClick = () => {
    executeSearch('CP01');
  };

  const getTitle = () => {
    if (mode === 'shirt') return isTH ? 'สแกน QR Code เพื่อเช็ครับเสื้อ' : 'Scan QR Code for Shirt Pickup';
    if (mode === 'daily') return isTH ? 'สแกน QR Code เพื่อลงทะเบียนเข้าร่วมกิจกรรมรายวัน' : 'Scan QR Code for Daily Event Registration';
    return isTH ? 'สแกน QR Code เพื่อค้นหานักศึกษา' : 'Scan QR Code to Search Student';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between overflow-hidden py-1 min-h-0">
      {/* Top Header Bar with aligned Back Button */}
      <div className="w-full flex items-center justify-between mb-1.5 shrink-0">
        <button 
          onClick={() => navigate('/')} 
          className="text-white/90 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/15 shadow-md"
        >
          <ArrowLeft size={18} /> {isTH ? 'กลับไปเมนูหลัก' : 'Back to Main Menu'}
        </button>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel p-4 sm:p-6 w-full flex-1 min-h-0 flex flex-col items-center justify-between overflow-hidden shadow-2xl">
        
        {/* Title */}
        <h2 className="text-xs sm:text-base md:text-lg font-bold text-center text-white text-glow shrink-0 mb-1">
          {getTitle()}
        </h2>

        {/* Scaled Camera Box */}
        <div 
          onClick={handleMockScanClick}
          className="w-full max-w-[270px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[480px] h-[45vh] max-h-[420px] aspect-square rounded-2xl bg-black/75 border-2 sm:border-3 border-white/80 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xl shadow-magical-purple/40 transition-transform duration-200 active:scale-98 hover:border-white my-1 shrink min-h-[160px]"
        >
          {/* Real Video Stream */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-0">
              <Camera size={56} className="text-white/60 mb-1" />
            </div>
          )}

          {/* Scanner Reticles */}
          <div className="absolute top-3 left-3 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-l-4 border-white rounded-tl-xl pointer-events-none z-10"></div>
          <div className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-r-4 border-white rounded-tr-xl pointer-events-none z-10"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-l-4 border-white rounded-bl-lg pointer-events-none z-10"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-r-4 border-white rounded-br-lg pointer-events-none z-10"></div>

          {/* Laser Line */}
          <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_#ffffff] animate-scan-line pointer-events-none z-10"></div>
        </div>

        {/* Short Code Input Form */}
        <form onSubmit={handleSearch} className="w-full space-y-2 pt-2 border-t border-white/10 shrink-0">
          <div>
            <label className="block text-[11px] sm:text-xs md:text-sm font-medium text-white/80 mb-1 text-center">
              {isTH ? 'หรือกรอก Short Code 4 หลัก' : 'Or enter 4-digit Short Code'}
            </label>
            <input 
              type="text" 
              value={code}
              maxLength={4}
              onChange={handleCodeChange}
              className="w-full px-3.5 py-2 text-center text-base sm:text-xl font-bold tracking-widest rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-magical-light uppercase font-mono"
              placeholder="AB12"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" className="w-full glass-button py-2.5 sm:py-3 flex justify-center items-center gap-2 text-xs sm:text-sm md:text-base font-semibold">
            <Search size={18} /> {isTH ? 'ค้นหา' : 'Search'}
          </button>
        </form>

      </div>
    </div>
  );
}
