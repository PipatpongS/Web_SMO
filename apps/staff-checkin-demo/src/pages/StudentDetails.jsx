import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';
import { ArrowLeft, Save, Check, CheckCircle2, X, Lock, Camera, Search, QrCode, RefreshCw, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'all'; // 'shirt' | 'daily' | 'all'
  const { students, findStudentByCode, updateCheckin, lang } = useMockData();
  const [student, setStudent] = useState(null);

  const isTH = lang === 'TH';

  // Form states
  const [isProxy, setIsProxy] = useState(false);
  const [proxyName, setProxyName] = useState('');
  const [proxyStudentId, setProxyStudentId] = useState('');
  const [modalShortCode, setModalShortCode] = useState('');
  const [scannedProxy, setScannedProxy] = useState(null);
  
  // Status states for UI toggles
  const [chkShirt, setChkShirt] = useState(true); // Demo: Auto-checked upon entering
  const [chkD1M, setChkD1M] = useState(true);     // Demo: Auto-checked Day 25 Morning
  const [chkD1A, setChkD1A] = useState(false);
  const [chkD2M, setChkD2M] = useState(false);
  const [chkD2A, setChkD2A] = useState(false);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProxyScanModal, setShowProxyScanModal] = useState(false);

  // Camera stream for Proxy Scanner Modal
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanLoopRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const found = students.find(s => s.id === id);
    if (found) {
      setStudent(found);
      // Demo Rule: Auto check shirt pickup & Day 25 Morning upon entry
      setChkShirt(true);
      setChkD1M(true);
      setIsProxy(!!found.proxy_name);
      setProxyName(found.proxy_name || '');
      setChkD1A(false);
      setChkD2M(false);
      setChkD2A(false);
    } else {
      navigate(`/scan?mode=${mode}`);
    }
  }, [id, students, navigate, mode]);

  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [cameraStream, setCameraStream] = useState(null);
  const [proxyCameraActive, setProxyCameraActive] = useState(false);

  const startCamera = async (deviceId = null) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: 'environment' } }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(newStream);
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
        
        if (availableDevices.length > 1) {
          const mainCamIndex = availableDevices.findIndex(d => d.label.includes('0, facing back'));
          if (mainCamIndex !== -1 && mainCamIndex !== 0) {
            setCurrentDeviceIndex(mainCamIndex);
            startCamera(availableDevices[mainCamIndex].deviceId);
          }
        }
      }
    } catch (err) {
      console.log('Camera error for proxy scanner:', err);
    }
  };

  useEffect(() => {
    if (showProxyScanModal) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setCameraStream(null);
      setProxyCameraActive(false);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (scanLoopRef.current) {
        clearTimeout(scanLoopRef.current);
      }
    };
  }, [showProxyScanModal]);

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
        if (scanLoopRef.current) {
          clearTimeout(scanLoopRef.current);
          scanLoopRef.current = null;
        }
        processScannedProxy(code.data);
        return; 
      }
    }
    scanLoopRef.current = setTimeout(scanQR, 250);
  };

  const processScannedProxy = (searchVal) => {
    const found = findStudentByCode(searchVal);
    if (found) {
      setScannedProxy({
        id: found.id,
        name: `${found.firstName} ${found.lastName}`,
        phone: found.phone || "089-876-5432"
      });
      setProxyName(`${found.id} - ${found.firstName} ${found.lastName}`);
    } else {
      // If a real unknown QR code is scanned, just use the raw payload
      setScannedProxy({
        id: searchVal.slice(0, 15), // Truncate if it's too long
        name: "รับแทนบุคคลภายนอก",
        phone: "-"
      });
      setProxyName(`${searchVal.slice(0, 15)} - รับแทนบุคคลภายนอก`);
    }
    setProxyStudentId('');
    setShowProxyScanModal(false);
    setModalShortCode('');
  };

  const switchCamera = (e) => {
    e.stopPropagation();
    if (videoDevices.length > 1) {
      const nextIndex = (currentDeviceIndex + 1) % videoDevices.length;
      setCurrentDeviceIndex(nextIndex);
      startCamera(videoDevices[nextIndex].deviceId);
    }
  };

  if (!student) return null;

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    
    // Resolve final proxy display string for database/store
    let finalProxyStr = '';
    if (scannedProxy) {
      finalProxyStr = `${scannedProxy.id} - ${scannedProxy.name} (${scannedProxy.phone})`;
    } else if (proxyStudentId) {
      finalProxyStr = `รหัสนักศึกษา: ${proxyStudentId}`;
    } else if (proxyName) {
      finalProxyStr = proxyName;
    }

    if (mode === 'shirt' || mode === 'all') {
      updateCheckin(id, 'checkin_day0_shirt', chkShirt, isProxy ? finalProxyStr : '');
    }
    if (mode === 'daily' || mode === 'all') {
      updateCheckin(id, 'checkin_day1_morning', chkD1M);
      updateCheckin(id, 'checkin_day1_afternoon', chkD1A);
      updateCheckin(id, 'checkin_day2_morning', chkD2M);
      updateCheckin(id, 'checkin_day2_afternoon', chkD2A);
    }

    // Show success modal then navigate back
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate(`/scan?mode=${mode}`);
    }, 1500);
  };

  // Proxy Student ID input handler (restricted to max 11 digits, numbers only)
  const handleProxyStudentIdChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
    setProxyStudentId(onlyDigits);
    setScannedProxy(null);
    setProxyName('');
  };

  const handleModalShortCodeChange = (e) => {
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

    setModalShortCode((letters + digits).slice(0, 4));
  };

  // Proxy modal shortcode search handler
  const handleProxyModalSubmit = (e) => {
    e.preventDefault();
    processScannedProxy(modalShortCode.trim());
  };

  const handleSimulateProxyScan = () => {
    setScannedProxy({
      id: "69070500002",
      name: "สมหญิง เรียนเก่ง",
      phone: "089-876-5432"
    });
    setProxyName('69070500002 - สมหญิง เรียนเก่ง');
    setProxyStudentId('');
    setShowProxyScanModal(false);
  };

  const showShirtCard = mode === 'shirt' || mode === 'all';
  const showDailyCards = mode === 'daily' || mode === 'all';

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto pr-1 sm:pr-2 pb-6 pt-1 space-y-3 relative scroll-smooth">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(`/scan?mode=${mode}`)} 
        className="self-start text-white hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all border border-white/30 shadow-md shrink-0 mb-1"
      >
        <ArrowLeft size={18} /> {isTH ? 'ย้อนกลับไปสแกน' : 'Back to Scan'}
      </button>

      {/* Profile Card (Solid White Card - กรอบขาวทึบ) */}
      <div className="bg-white text-gray-900 border border-gray-100 shadow-xl rounded-2xl p-4 sm:p-5 w-full shrink-0">
        <h2 className="text-xs text-purple-700 font-bold tracking-wider mb-1 uppercase">
          {isTH ? 'ข้อมูลนักศึกษา' : 'Student Profile'}
        </h2>
        <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">{student.firstName} {student.lastName}</p>
        <p className="text-gray-700 text-xs sm:text-sm font-semibold">{isTH ? 'รหัสนักศึกษา' : 'Student ID'}: <span className="font-bold text-gray-900">{student.id}</span></p>
        <p className="text-gray-700 text-xs sm:text-sm font-semibold">{isTH ? 'ภาควิชา' : 'Department'}: <span className="font-bold text-gray-900">{student.department}</span></p>
      </div>

      {/* Action Check-in Cards */}
      {showShirtCard && (
        <div className="bg-white text-gray-900 border border-gray-100 shadow-xl rounded-2xl p-4 sm:p-5">
          <h3 className="font-extrabold text-sm sm:text-base mb-3 text-purple-900 border-b border-gray-200 pb-2">
            {isTH ? '24 ก.ค. - เช็ครับเสื้อ' : '24 Jul - Shirt Pickup'}
          </h3>
          
          {/* Large Touchable Selection Card */}
          <div 
            onClick={() => setChkShirt(!chkShirt)}
            className={`w-full p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              chkShirt 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-md' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
            }`}
          >
            <span className="text-xs sm:text-sm md:text-base">
              {isTH ? 'ยืนยันการรับเสื้อ' : 'Confirm Shirt Pickup'}
            </span>
            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
              chkShirt ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'border-gray-300 bg-white'
            }`}>
              {chkShirt && <Check size={20} strokeWidth={3} />}
            </div>
          </div>

          {student.checkin_day0_shirt_timestamp && chkShirt && (
            <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] sm:text-xs text-emerald-700 font-medium px-1 animate-fadeIn">
              <CheckCircle2 size={12} className="shrink-0" />
              <span>{isTH ? 'บันทึกโดย:' : 'Saved by:'} {student.checkin_day0_shirt_by}</span>
              <span className="text-emerald-400">|</span>
              <span>{new Date(student.checkin_day0_shirt_timestamp).toLocaleString(isTH ? 'th-TH' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
          )}

          {chkShirt && (
            <div className="mt-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
              <div 
                onClick={() => setIsProxy(!isProxy)}
                className="flex items-center justify-between cursor-pointer py-1"
              >
                <span className="text-xs sm:text-sm text-gray-800 font-semibold">{isTH ? 'มีผู้รับแทน' : 'Picked up by Proxy'}</span>
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isProxy ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300 bg-white'
                }`}>
                  {isProxy && <Check size={16} strokeWidth={3} />}
                </div>
              </div>

              {isProxy && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-200 space-y-3 animate-fadeIn">
                  
                  {/* 1. Main Button to Open Scan/ShortCode Pop-up Modal */}
                  <button 
                    type="button"
                    onClick={() => setShowProxyScanModal(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                  >
                    <QrCode size={18} />
                    <span>{isTH ? 'เปิดกล้องสแกน QR Code / กรอก Short Code ผู้รับแทน' : 'Scan QR Code / Short Code for Proxy'}</span>
                  </button>

                  {/* Show Scanned Proxy Info (Name, Student ID, Phone) in Yellow Box */}
                  {scannedProxy && (
                    <div className="bg-amber-50 border-2 border-amber-300 p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm md:text-base text-amber-950 font-medium space-y-1.5 relative shadow-md animate-fadeIn">
                      <button 
                        type="button" 
                        onClick={() => { setScannedProxy(null); setProxyName(''); }}
                        className="absolute top-3 right-3 text-amber-700 hover:text-amber-950 p-1"
                      >
                        <X size={18} />
                      </button>
                      <p className="font-extrabold text-amber-900 border-b border-amber-200 pb-1.5 text-sm sm:text-base">
                        {isTH ? 'ผู้รับแทน:' : 'Proxy Recipient:'}
                      </p>
                      <p><span className="text-amber-800 font-semibold">{isTH ? 'ชื่อ-นามสกุล:' : 'Name:'}</span> <strong className="text-amber-950 font-bold">{scannedProxy.name}</strong></p>
                      <p><span className="text-amber-800 font-semibold">{isTH ? 'รหัสนักศึกษา:' : 'Student ID:'}</span> <strong className="font-mono font-extrabold text-purple-900">{scannedProxy.id}</strong></p>
                      <p><span className="text-amber-800 font-semibold">{isTH ? 'เบอร์โทรศัพท์:' : 'Phone:'}</span> <strong className="font-mono font-extrabold text-emerald-800">{scannedProxy.phone}</strong></p>
                    </div>
                  )}

                  {/* 2. Fallback Student ID input */}
                  <div className="pt-1">
                    <label className="block text-[11px] sm:text-xs text-gray-700 font-semibold mb-1">
                      {isTH ? 'หากไม่มี ให้กรอกรหัสนักศึกษาผู้รับแทน:' : 'Or enter Student ID:'}
                    </label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={proxyStudentId}
                      onChange={handleProxyStudentIdChange}
                      placeholder={isTH ? 'กรอกรหัสนักศึกษาผู้รับแทน...' : 'Enter Student ID...'} 
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-sans font-medium text-gray-900 placeholder-gray-400 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showDailyCards && (
        <>
          {/* Day 1: Check-in (25 ก.ค. - Only Morning Active, Afternoon Disabled) */}
          <div className="bg-white text-gray-900 border border-gray-100 shadow-xl rounded-2xl p-4 sm:p-5">
            <h3 className="font-extrabold text-xs sm:text-sm md:text-base mb-3 text-purple-900 border-b border-gray-200 pb-2">
              {isTH ? '25 ก.ค. - ลงทะเบียนกิจกรรม' : '25 Jul - Event Registration'}
            </h3>
            <div className="space-y-2.5">
              {/* Day 25 Morning - ACTIVE & Auto-Checked */}
              <div 
                onClick={() => setChkD1M(!chkD1M)}
                className={`w-full p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  chkD1M 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-md' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span className="text-xs sm:text-sm md:text-base">{isTH ? 'เช็คชื่อ ช่วงเช้า' : 'Morning Check-in'}</span>
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                  chkD1M ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'border-gray-300 bg-white'
                }`}>
                  {chkD1M && <Check size={20} strokeWidth={3} />}
                </div>
              </div>
              
              {student.checkin_day1_morning_timestamp && chkD1M && (
                <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] sm:text-xs text-emerald-700 font-medium px-1 animate-fadeIn">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>{isTH ? 'บันทึกโดย:' : 'Saved by:'} {student.checkin_day1_morning_by}</span>
                  <span className="text-emerald-400">|</span>
                  <span>{new Date(student.checkin_day1_morning_timestamp).toLocaleString(isTH ? 'th-TH' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              )}

              {/* Day 25 Afternoon - DISABLED (Greyed out button) */}
              <div 
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 opacity-65 cursor-not-allowed flex items-center justify-between select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm md:text-base font-medium">{isTH ? 'เช็คชื่อ ช่วงบ่าย' : 'Afternoon Check-in'}</span>
                  <span className="text-[10px] sm:text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <Lock size={12} /> {isTH ? 'ยังไม่ถึงเวลา' : 'Closed'}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg border-2 border-gray-300 bg-gray-200 flex items-center justify-center shrink-0"></div>
              </div>
            </div>
          </div>

          {/* Day 2: Check-in (26 ก.ค. - ALL DISABLED Greyed Out) */}
          <div className="bg-white text-gray-900 border border-gray-100 shadow-xl rounded-2xl p-4 sm:p-5 opacity-80">
            <h3 className="font-extrabold text-xs sm:text-sm md:text-base mb-3 text-purple-900 border-b border-gray-200 pb-2 flex items-center justify-between gap-1.5">
              <span className="whitespace-nowrap">{isTH ? '26 ก.ค. - ลงทะเบียนกิจกรรม' : '26 Jul - Event Registration'}</span>
              <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-semibold border border-gray-200 flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Lock size={12} /> {isTH ? 'ยังไม่ถึงเวลา' : 'Upcoming'}
              </span>
            </h3>
            <div className="space-y-2.5">
              {/* Day 26 Morning - DISABLED */}
              <div 
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 opacity-65 cursor-not-allowed flex items-center justify-between select-none"
              >
                <span className="text-xs sm:text-sm md:text-base font-medium">{isTH ? 'เช็คชื่อ ช่วงเช้า' : 'Morning Check-in'}</span>
                <div className="w-7 h-7 rounded-lg border-2 border-gray-300 bg-gray-200 flex items-center justify-center shrink-0"></div>
              </div>

              {/* Day 26 Afternoon - DISABLED */}
              <div 
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 opacity-65 cursor-not-allowed flex items-center justify-between select-none"
              >
                <span className="text-xs sm:text-sm md:text-base font-medium">{isTH ? 'เช็คชื่อ ช่วงบ่าย' : 'Afternoon Check-in'}</span>
                <div className="w-7 h-7 rounded-lg border-2 border-gray-300 bg-gray-200 flex items-center justify-center shrink-0"></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="pt-2 shrink-0">
        <button onClick={handleOpenConfirm} className="glass-button w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm md:text-base font-bold shadow-2xl">
          <Save size={20} /> {isTH ? 'ยืนยันบันทึกข้อมูล' : 'Save Changes'}
        </button>
      </div>

      {/* POP-UP MODAL: Camera Scanner + Short Code input for Proxy */}
      {showProxyScanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 text-white border border-white/20 rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md md:max-w-lg w-full shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setShowProxyScanModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>

            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center justify-center gap-2 text-center pr-6">
              <Camera size={22} className="text-purple-400 shrink-0" /> 
              <span className="leading-snug">{isTH ? 'สแกน QR Code หรือกรอก Short Code ผู้รับแทน' : 'Scan QR Code or Short Code (Proxy)'}</span>
            </h3>

            {/* Real Camera View Box (Scales adaptively to screen size) */}
            <div 
              onClick={handleSimulateProxyScan}
              className="w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] aspect-square bg-black rounded-2xl border-2 border-purple-500/80 relative overflow-hidden flex items-center justify-center cursor-pointer mx-auto my-2 shadow-2xl shadow-purple-500/20"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                onPlaying={() => setProxyCameraActive(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${proxyCameraActive ? 'opacity-100' : 'opacity-0'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Loading Spinner */}
              {!proxyCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-0">
                  <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                </div>
              )}

              {/* White Reticle Corners */}
              <div className="absolute top-3 left-3 w-7 h-7 border-t-3 border-l-3 border-white rounded-tl-lg pointer-events-none"></div>
              <div className="absolute top-3 right-3 w-7 h-7 border-t-3 border-r-3 border-white rounded-tr-lg pointer-events-none"></div>
              <div className="absolute bottom-3 left-3 w-7 h-7 border-b-3 border-l-3 border-white rounded-bl-lg pointer-events-none"></div>
              <div className="absolute bottom-3 right-3 w-7 h-7 border-b-3 border-r-3 border-white rounded-br-lg pointer-events-none"></div>

              {/* Camera Switcher Button */}
              {videoDevices.length > 1 && (
                <button 
                  onClick={switchCamera}
                  className="absolute top-2 right-12 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 z-20"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>

            {/* Short Code Form inside Modal */}
            <form onSubmit={handleProxyModalSubmit} className="space-y-2.5 pt-2 border-t border-white/10 text-left">
              <label className="block text-xs sm:text-sm font-semibold text-white/90 text-center">
                {isTH ? 'หรือกรอก Short Code 4 หลัก' : 'Or enter 4-digit Short Code'}
              </label>
              <input 
                type="text" 
                maxLength={4}
                value={modalShortCode}
                onChange={handleModalShortCodeChange}
                placeholder="AB12" 
                className="w-full px-4 py-2.5 sm:py-3 text-center text-lg sm:text-xl font-mono font-bold tracking-widest rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase"
              />
              <button
                type="submit"
                className="glass-button w-full py-2.5 sm:py-3 flex justify-center items-center gap-2 text-xs sm:text-sm font-bold shadow-lg"
              >
                <Search size={18} /> {isTH ? 'ยืนยัน Short Code ผู้รับแทน' : 'Confirm Proxy Short Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-gray-900 border border-gray-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
              <CheckCircle2 size={38} />
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
              {isTH ? 'ยืนยันการบันทึกข้อมูล?' : 'Confirm Save Changes?'}
            </h3>

            <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-left space-y-1 text-xs sm:text-sm">
              <p className="text-gray-600 font-medium">{isTH ? 'นักศึกษา:' : 'Student:'} <span className="text-gray-900 font-bold">{student.firstName} {student.lastName}</span></p>
              <p className="text-gray-600 font-medium">{isTH ? 'รหัสนักศึกษา:' : 'ID:'} <span className="text-purple-700 font-mono font-extrabold">{student.id}</span></p>
              <p className="text-gray-600 font-medium">{isTH ? 'ภาควิชา:' : 'Dept:'} <span className="text-gray-900 font-bold">{student.department}</span></p>
              {isProxy && (scannedProxy || proxyStudentId || proxyName) && (
                <div className="pt-1.5 border-t border-gray-200 mt-1 space-y-0.5">
                  <p className="text-amber-800 font-bold">{isTH ? 'ข้อมูลผู้รับแทน:' : 'Proxy Details:'}</p>
                  {scannedProxy ? (
                    <>
                      <p className="text-gray-700">{isTH ? 'ชื่อ-นามสกุล:' : 'Name:'} <span className="font-bold text-gray-900">{scannedProxy.name}</span></p>
                      <p className="text-gray-700">{isTH ? 'รหัสนักศึกษา:' : 'ID:'} <span className="font-bold text-purple-800 font-mono">{scannedProxy.id}</span></p>
                      <p className="text-gray-700">{isTH ? 'เบอร์โทรศัพท์:' : 'Phone:'} <span className="font-bold text-emerald-800 font-mono">{scannedProxy.phone}</span></p>
                    </>
                  ) : (
                    <p className="text-gray-900 font-bold">{proxyStudentId ? `รหัสนักศึกษา: ${proxyStudentId}` : proxyName}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition-colors"
              >
                {isTH ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                {isTH ? 'ยืนยันบันทึก' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-gray-900 border border-emerald-300 rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40 animate-bounce">
              <Check size={36} strokeWidth={3} />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              {isTH ? 'บันทึกสำเร็จ!' : 'Saved Successfully!'}
            </h3>
            <p className="text-xs text-emerald-700 font-bold">
              {isTH ? 'ระบบอัปเดตข้อมูลเรียบร้อยแล้ว' : 'Data updated successfully'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
