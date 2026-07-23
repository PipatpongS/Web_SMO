import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';
import { ArrowLeft, Search, Camera, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

export default function ScanInput() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanLoopRef = useRef(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'all'; // 'shirt' | 'daily' | 'all'
  const { findStudentByCode, students, lang } = useMockData();

  const isTH = lang === 'TH';

  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [stream, setStream] = useState(null);

  const startCamera = async (deviceId = null) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia is not supported on insecure HTTP connections over IP');
        setCameraActive(false);
        return;
      }

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: 'environment' } }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute("playsinline", true);
        setCameraActive(true);
        
        // Start QR scanning loop once video is playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          scanLoopRef.current = setTimeout(scanQR, 250);
        };
      }

      // Enumerate devices after permission is granted to get labels
      if (!deviceId) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = devices.filter(d => d.kind === 'videoinput');
        // Try to filter only back cameras if labels exist
        const backCams = vDevices.filter(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('rear'));
        const availableDevices = backCams.length > 0 ? backCams : vDevices;
        
        setVideoDevices(availableDevices);
        
        // Try to auto-select main camera (camera2 0) for Samsung devices
        if (availableDevices.length > 1) {
          const mainCamIndex = availableDevices.findIndex(d => d.label.includes('0, facing back'));
          if (mainCamIndex !== -1 && mainCamIndex !== 0) {
            setCurrentDeviceIndex(mainCamIndex);
            startCamera(availableDevices[mainCamIndex].deviceId);
          }
        }
      }
    } catch (err) {
      console.log('Camera access not available or denied:', err);
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanLoopRef.current) {
        clearTimeout(scanLoopRef.current);
      }
    };
  }, []);

  const scanQR = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        // Stop scanning to prevent multiple scans
        if (scanLoopRef.current) {
          clearTimeout(scanLoopRef.current);
          scanLoopRef.current = null;
        }
        executeSearch(code.data);
        return; // Don't queue next frame
      }
    }
    // Continue scanning (throttle to ~4 FPS to prevent lag)
    scanLoopRef.current = setTimeout(scanQR, 250);
  };

  const switchCamera = (e) => {
    e.stopPropagation();
    if (videoDevices.length > 1) {
      const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
      setCurrentDeviceIndex(nextIndex);
      startCamera(videoDevices[nextIndex].deviceId);
    }
  };

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
          <canvas ref={canvasRef} className="hidden" />



          {/* Camera Switcher Button */}
          {videoDevices.length > 1 && (
            <button 
              onClick={switchCamera}
              className="absolute top-4 right-14 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 z-20"
            >
              <RefreshCw size={20} className="sm:w-6 sm:h-6" />
            </button>
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
