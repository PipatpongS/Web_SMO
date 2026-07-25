import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { ArrowLeft, Search, Camera, RefreshCw, Loader2, QrCode, UserCheck, ClipboardCheck, Shirt } from 'lucide-react';
import jsQR from 'jsqr';

export default function ScanInput() {
  const [code, setCode] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanLoopRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();
  const { findStudentByCodeDirect, lang } = useData();

  const isTH = lang === 'TH';

  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const startCamera = async (deviceId = null) => {
    setCameraActive(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia is not supported on insecure HTTP connections');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute("playsinline", true);

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          scanLoopRef.current = setTimeout(scanQR, 250);
        };
      }

      if (!deviceId) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = devices.filter(d => d.kind === 'videoinput');
        const backCams = vDevices.filter(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('rear'));
        const availableDevices = backCams.length > 0 ? backCams : vDevices;

        setVideoDevices(availableDevices);
      }
    } catch (err) {
      console.log('Camera access error:', err);
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
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
      const w = video.videoWidth;
      const h = video.videoHeight;

      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, w, h);

        // 1. Normal Scan (Supports light & dark background inversion)
        const imageData = ctx.getImageData(0, 0, w, h);
        let qrData = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        // 2. Multi-Angle Scan: Attempt 45-degree rotation for tilted/angled phone screens
        if (!qrData || !qrData.data) {
          const cropSize = Math.min(w, h);
          const cropX = (w - cropSize) / 2;
          const cropY = (h - cropSize) / 2;

          const rotCanvas = document.createElement('canvas');
          rotCanvas.width = cropSize;
          rotCanvas.height = cropSize;
          const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });

          rotCtx.save();
          rotCtx.translate(cropSize / 2, cropSize / 2);
          rotCtx.rotate((45 * Math.PI) / 180);
          rotCtx.drawImage(video, cropX, cropY, cropSize, cropSize, -cropSize / 2, -cropSize / 2, cropSize, cropSize);
          rotCtx.restore();

          const rotImageData = rotCtx.getImageData(0, 0, cropSize, cropSize);
          qrData = jsQR(rotImageData.data, cropSize, cropSize, {
            inversionAttempts: "attemptBoth",
          });
        }

        if (qrData && qrData.data) {
          if (scanLoopRef.current) {
            clearTimeout(scanLoopRef.current);
            scanLoopRef.current = null;
          }
          executeSearch(qrData.data, 'QR_CODE');
          return;
        }
      }
    }
    scanLoopRef.current = setTimeout(scanQR, 100);
  };

  const switchCamera = (e) => {
    e.stopPropagation();
    if (videoDevices.length > 1) {
      const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
      setCurrentDeviceIndex(nextIndex);
      startCamera(videoDevices[nextIndex].deviceId);
    }
  };

  const handleCodeChange = (e) => {
    setError('');
    const inputVal = e.target.value.toUpperCase();

    if (!inputVal) {
      setCode('');
      return;
    }

    if (isWalkinMode) {
      let clean = inputVal.replace(/[^A-Z0-9]/g, '');
      if (clean.startsWith('W') && clean.length > 1) {
        clean = clean.slice(1);
      }
      setCode(clean.slice(0, 4));
    } else {
      let clean = inputVal.replace(/[^A-Z0-9-]/g, '');
      setCode(clean.slice(0, 8));
    }
  };

  const [isSearching, setIsSearching] = useState(false);

  const executeSearch = async (searchCode, method = 'SHORT_CODE') => {
    let rawStr = searchCode.replace(/\s+/g, '').toUpperCase();
    if (!rawStr) {
      setError(
        isTH
          ? (method === 'STUDENT_ID' ? 'กรุณากรอกรหัสนักศึกษา 11 หลัก' : (isWalkinMode ? 'กรุณากรอก Short Code (เช่น W-AB12)' : 'กรุณากรอก Short Code (เช่น AB12)'))
          : (method === 'STUDENT_ID' ? 'Please enter 11-digit Student ID' : 'Please enter Short Code')
      );
      return;
    }

    let targetCode = rawStr;
    if (isWalkinMode && method === 'SHORT_CODE') {
      if (rawStr.startsWith('W-')) {
        targetCode = rawStr;
      } else if (rawStr.startsWith('W') && rawStr.length > 1) {
        targetCode = `W-${rawStr.slice(1)}`;
      } else {
        targetCode = `W-${rawStr}`;
      }
    }

    setIsSearching(true);
    setError('');

    try {
      const student = await findStudentByCodeDirect(targetCode);

      if (student) {
        navigate(`/student/${student.docId || student.id}?method=${method}&mode=${mode}`);
      } else {
        setError(isTH ? `ไม่พบข้อมูลนักศึกษาด้วยรหัส "${targetCode}"` : `Student not found with code "${targetCode}"`);
        if (method === 'QR_CODE') {
          scanLoopRef.current = setTimeout(scanQR, 1500);
        }
      }
    } catch (err) {
      console.error("Execute search error:", err);
      setError(isTH ? `เกิดข้อผิดพลาดในการค้นหา: ${err?.message || String(err)}` : `Search error: ${err?.message || String(err)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(isWalkinMode ? `W-${code}` : code, 'SHORT_CODE');
  };

  const handleStudentIdSubmit = (e) => {
    e.preventDefault();
    const cleanId = studentIdInput.replace(/\D/g, '').trim();
    if (cleanId.length !== 11) {
      setError(isTH ? 'กรุณากรอกรหัสนักศึกษา 11 หลัก' : 'Please enter an 11-digit Student ID');
      return;
    }
    executeSearch(cleanId, 'STUDENT_ID');
  };

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode') || 'shirt';
  const isWalkinMode = mode === 'walkin';
  const isCheckinMode = mode === 'checkin';

  return (
    <div className="w-full flex flex-col items-center justify-start py-3 pb-24 sm:pb-28 px-3 sm:px-4 space-y-3">

      {/* Top Navigation Bar */}
      <div className="w-full flex items-center justify-between mb-1.5 shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="text-white/90 hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/15 shadow-md cursor-pointer"
        >
          <ArrowLeft size={18} /> {isTH ? 'กลับไปเมนูหลัก' : 'Back to Main Menu'}
        </button>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel p-4 sm:p-5 w-full flex-1 min-h-0 flex flex-col items-center justify-between overflow-hidden shadow-2xl">

        {/* Mode Indicator & Title */}
        <div className="flex flex-col items-center mb-1 shrink-0 space-y-1">
          <span className={`text-[10px] sm:text-xs px-3 py-1 rounded-full font-black border uppercase tracking-wider inline-flex items-center gap-1.5 ${isWalkinMode
            ? 'bg-amber-400/30 text-amber-200 border-amber-400/50'
            : isCheckinMode
              ? 'bg-teal-500/30 text-teal-200 border-teal-400/50'
              : 'bg-purple-500/30 text-purple-200 border-purple-400/50'
            }`}>
            {isWalkinMode ? (
              <>
                <UserCheck size={14} className="text-amber-300" />
                <span>{isTH ? 'โหมดอนุมัติ Walk-in' : 'Walk-in Approval Mode'}</span>
              </>
            ) : isCheckinMode ? (
              <>
                <ClipboardCheck size={14} className="text-teal-300" />
                <span>{isTH ? 'โหมดเช็คชื่อลงทะเบียน' : 'Registration Check-in Mode'}</span>
              </>
            ) : (
              <>
                <Shirt size={14} className="text-purple-300" />
                <span>{isTH ? 'โหมดเช็ครับเสื้อ' : 'Shirt Pickup Mode'}</span>
              </>
            )}
          </span>
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-center text-white text-glow">
            {isWalkinMode
              ? (isTH ? 'สแกน QR Code เพื่ออนุมัติการลงทะเบียน' : 'Scan QR Code for Walk-in Approval')
              : isCheckinMode
                ? (isTH ? 'สแกน QR / Short Code / รหัสนักศึกษา เพื่อเช็คชื่อ' : 'Scan QR / Short Code / Student ID for Check-in')
                : (isTH ? 'สแกน QR Code เพื่อเช็ครับเสื้อ' : 'Scan QR Code for Shirt Pickup')}
          </h2>
        </div>

        {/* White Camera Box */}
        <div className="w-full max-w-[270px] sm:max-w-[380px] md:max-w-[440px] h-[44vh] max-h-[380px] aspect-square rounded-2xl bg-black/75 border-2 sm:border-3 border-white/80 relative overflow-hidden flex items-center justify-center shadow-2xl my-1 shrink min-h-[160px]">
          {/* Real Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => setCameraActive(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Loading Spinner */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 gap-2">
              <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
              <span className="text-xs text-white/70 font-medium">{isTH ? 'กำลังเปิดกล้อง...' : 'Starting camera...'}</span>
            </div>
          )}

          {/* Camera Switcher Button */}
          {videoDevices.length > 1 && (
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 z-20 cursor-pointer"
              title={isTH ? 'สลับกล้อง' : 'Switch camera'}
            >
              <RefreshCw size={20} />
            </button>
          )}

          {/* White Scanner Reticles */}
          <div className="absolute top-3 left-3 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-l-4 border-white rounded-tl-xl pointer-events-none z-10"></div>
          <div className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 border-t-4 border-r-4 border-white rounded-tr-xl pointer-events-none z-10"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-l-4 border-white rounded-bl-lg pointer-events-none z-10"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 sm:w-10 sm:h-10 border-b-4 border-r-4 border-white rounded-br-lg pointer-events-none z-10"></div>
        </div>

        {/* Short Code Input Form */}
        <form onSubmit={handleSearchSubmit} className="w-full space-y-2 pt-2 border-t border-white/10 shrink-0">
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-white/80 mb-1 text-center">
              {isTH
                ? (isWalkinMode ? 'หรือกรอก Short Code Walk-in (เช่น W-AB12)' : 'หรือกรอก Short Code (เช่น AB12)')
                : (isWalkinMode ? 'Or enter Walk-in Short Code (e.g. W-AB12)' : 'Or enter Short Code (e.g. AB12)')}
            </label>

            {isWalkinMode ? (
              <div className="flex items-center justify-center bg-white/10 border border-white/20 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
                <span className="pl-4 font-mono font-black text-lg sm:text-xl text-amber-300 select-none border-r border-white/20 pr-2.5 py-2 shrink-0">
                  W-
                </span>
                <input
                  type="text"
                  value={code}
                  maxLength={4}
                  onChange={handleCodeChange}
                  className="w-full px-3 py-2 text-left text-lg sm:text-xl font-bold tracking-[0.2em] bg-transparent text-white placeholder-white/30 focus:outline-none uppercase font-mono"
                  placeholder="AB12"
                />
              </div>
            ) : (
              <input
                type="text"
                value={code}
                maxLength={8}
                onChange={handleCodeChange}
                className="w-full px-3.5 py-2 text-center text-lg sm:text-xl font-bold tracking-[0.2em] rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase font-mono"
                placeholder="AB12"
              />
            )}
          </div>

          {error && <p className="text-red-400 text-xs text-center font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={isSearching}
            className="w-full glass-button py-2.5 sm:py-3 flex justify-center items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 size={18} className="animate-spin text-purple-300" />
                <span>{isTH ? 'กำลังค้นหา...' : 'Searching...'}</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>{isTH ? 'ค้นหาด้วย Short Code' : 'Search by Short Code'}</span>
              </>
            )}
          </button>
        </form>

        {isCheckinMode && (
          <form onSubmit={handleStudentIdSubmit} className="w-full space-y-2 pt-2 border-t border-white/10 shrink-0">
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-white/80 mb-1 text-center">
                {isTH ? 'หรือกรอกรหัสนักศึกษา 11 หลัก' : 'Or enter 11-digit Student ID'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={studentIdInput}
                maxLength={11}
                onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="w-full px-3.5 py-2 text-center text-lg sm:text-xl font-bold tracking-[0.15em] rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono"
                placeholder="6907050xxxx"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full glass-button py-2.5 sm:py-3 flex justify-center items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 bg-teal-600/40 hover:bg-teal-600/60 border-teal-400/40"
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin text-teal-300" />
                  <span>{isTH ? 'กำลังค้นหา...' : 'Searching...'}</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>{isTH ? 'ค้นหาด้วยรหัสนักศึกษา' : 'Search by Student ID'}</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
