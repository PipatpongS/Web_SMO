import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle, XCircle, Shirt, Phone, Loader2, QrCode, User } from 'lucide-react';
import jsQR from 'jsqr';

const SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') || 'DIRECT';

  const { students, findStudentByCodeDirect, confirmShirtPickup, revokeShirtPickup, lang } = useData();
  const isTH = lang === 'TH';

  const [student, setStudent] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isProxy, setIsProxy] = useState(false);
  const [proxyType, setProxyType] = useState('QR_CODE'); // 'QR_CODE' | 'MANUAL_INPUT'
  const [proxyStudentId, setProxyStudentId] = useState('');
  const [proxyName, setProxyName] = useState('');
  const [proxyPhone, setProxyPhone] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProxyScanModal, setShowProxyScanModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proxyCodeInput, setProxyCodeInput] = useState('');
  const [proxyError, setProxyError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const proxyScanLoopRef = useRef(null);
  const proxyStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    // 1. Search in local state (0 Reads)
    const found = students.find(s => s.docId === id || s.id === id || s.studentId === id || (s.short_code && s.short_code.toUpperCase() === id.toUpperCase()));
    if (found) {
      setStudent(found);
      const regSize = found.shirtSize || 'M';
      setSelectedSize(found.shirt_size_received || regSize);
      setIsProxy(!!found.proxy_name);
      setProxyType(found.proxy_type || 'QR_CODE');
      setProxyStudentId(found.proxy_student_id || '');
      setProxyName(found.proxy_name || '');
      setProxyPhone(found.proxy_phone || '');
    } else {
      // 2. Single-Doc Targeted Fetch from Firestore (1 Read)
      findStudentByCodeDirect(id).then(directMatch => {
        if (directMatch && isMounted) {
          setStudent(directMatch);
          const regSize = directMatch.shirtSize || 'M';
          setSelectedSize(directMatch.shirt_size_received || regSize);
          setIsProxy(!!directMatch.proxy_name);
          setProxyType(directMatch.proxy_type || 'QR_CODE');
          setProxyStudentId(directMatch.proxy_student_id || '');
          setProxyName(directMatch.proxy_name || '');
          setProxyPhone(directMatch.proxy_phone || '');
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Camera handling for scanning Proxy QR
  const startProxyCamera = async () => {
    setCameraActive(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      if (proxyStreamRef.current) {
        proxyStreamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      proxyStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          scanProxyQR();
        };
      }
    } catch (err) {
      console.error("Proxy camera init error:", err);
    }
  };

  const stopProxyCamera = () => {
    if (proxyScanLoopRef.current) clearTimeout(proxyScanLoopRef.current);
    if (proxyStreamRef.current) {
      proxyStreamRef.current.getTracks().forEach(track => track.stop());
      proxyStreamRef.current = null;
    }
  };

  const scanProxyQR = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        let qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (!qrCode || !qrCode.data) {
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
          qrCode = jsQR(rotImageData.data, cropSize, cropSize, {
            inversionAttempts: 'attemptBoth',
          });
        }

        if (qrCode && qrCode.data) {
          handleProxyLookup(qrCode.data, 'QR_CODE');
          return;
        }
      }
    }
    proxyScanLoopRef.current = setTimeout(scanProxyQR, 100);
  };

  useEffect(() => {
    if (showProxyScanModal) {
      startProxyCamera();
    } else {
      stopProxyCamera();
    }
    return () => stopProxyCamera();
  }, [showProxyScanModal]);

  // Handle Proxy Lookup
  const handleProxyLookup = async (codeStr, type) => {
    setProxyError('');
    const matchedStudent = await findStudentByCodeDirect(codeStr);

    if (matchedStudent) {
      setProxyName(`${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim());
      setProxyStudentId(matchedStudent.studentId || matchedStudent.id || '');
      setProxyPhone(matchedStudent.phone || '');
      setProxyType(type);
      setShowProxyScanModal(false);
    } else {
      setProxyError(isTH ? `ไม่พบข้อมูลสตาฟฟ์/ผู้รับแทนจากรหัส "${codeStr}"` : `Proxy student not found with "${codeStr}"`);
    }
  };

  const handleManualProxyChange = (stId, phone) => {
    setProxyStudentId(stId);
    setProxyPhone(phone);
    setProxyType('MANUAL_INPUT');
  };

  // Confirm Submit Handler
  const handleConfirmSubmit = async () => {
    if (!student) return;
    setIsSubmitting(true);

    const payload = {
      shirtSizeReceived: selectedSize,
      isProxy: isProxy,
      proxyType: isProxy ? proxyType : null,
      proxyStudentId: isProxy ? proxyStudentId : null,
      proxyName: isProxy ? proxyName : null,
      proxyPhone: isProxy ? proxyPhone : null
    };

    const success = await confirmShirtPickup(student.docId || student.id, payload);
    setIsSubmitting(false);

    if (success) {
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    }
  };

  // Revoke Handler
  const handleRevoke = async () => {
    if (!student) return;
    if (!window.confirm(isTH ? 'คุณต้องการยกเลิกการแจกเสื้อรายการนี้ใช่หรือไม่?' : 'Are you sure you want to revoke this shirt pickup?')) return;

    setIsSubmitting(true);
    const success = await revokeShirtPickup(student.docId || student.id);
    setIsSubmitting(false);

    if (success) {
      navigate('/scan');
    }
  };

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-300 mb-3" />
        <p className="text-white/80 font-medium">{isTH ? 'กำลังโหลดข้อมูลนักศึกษา...' : 'Loading student details...'}</p>
      </div>
    );
  }

  const formatStudentId = (idVal) => {
    if (!idVal || idVal === '69070500000' || String(idVal).includes('ยังไม่ได้รับ')) {
      return isTH ? 'ยังไม่ได้รับรหัสนักศึกษา' : 'Pending Student ID';
    }
    return idVal;
  };

  const isReceived = !!student.shirt_received_at;
  const registeredSize = student.shirtSize || 'M';
  const isSizeChanged = selectedSize !== registeredSize;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-start overflow-y-auto py-2 px-3 sm:px-4 min-h-0">
      
      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between mb-3 shrink-0">
        <button 
          onClick={() => navigate('/scan')} 
          className="text-white hover:text-white flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/20 shadow-md cursor-pointer"
        >
          <ArrowLeft size={16} /> {isTH ? 'กลับไปหน้าสแกน' : 'Back to Scan'}
        </button>
      </div>

      {/* Main Solid White Content Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 w-full shadow-2xl border border-slate-200/80 text-slate-800 space-y-5 my-auto">
        
        {/* Student Profile Overview Header */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                รหัสนักศึกษา: <span className={`text-slate-900 font-bold ${(student.studentId === '69070500000' || String(student.studentId).includes('ยังไม่ได้รับ')) ? '' : 'font-mono'}`}>{formatStudentId(student.studentId || student.id)}</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                ภาควิชา: <span className="text-slate-900 font-bold">{student.department || 'วิศวกรรมคอมพิวเตอร์'}</span>
              </p>
            </div>

            {/* Status & Note Badges */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isReceived ? (
                <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={14} className="text-emerald-600" /> รับแล้ว
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                  ยังไม่ได้รับเสื้อ
                </span>
              )}

              {student.note && (student.note.includes('รอบพิเศษ') || student.note.includes('รอบหน้างาน')) && (
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[11px] shadow-sm">
                  {isTH ? `หมายเหตุ: ${student.note}` : `Note: ${student.note}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* IF ALREADY RECEIVED -> Display Detailed Receipt info */}
        {isReceived ? (
          <div className="space-y-3 bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-emerald-950">
            <h3 className="font-extrabold text-emerald-800 text-sm sm:text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> ประวัติการรับเสื้อเรียบร้อย
            </h3>
            
            <div className="space-y-2 text-slate-800 font-medium">
              <p>🕒 <b>วันเวลาที่รับ:</b> {student.shirt_received_at}</p>
              <p>👤 <b>สตาฟฟ์ผู้แจก:</b> {student.shirt_received_by_staff_name || 'Staff'}</p>
              <p>👕 <b>ไซซ์เสื้อที่ได้รับ:</b> <span className="font-black text-amber-700 text-base">{student.shirt_size_received || student.shirtSize}</span> (ไซซ์คงเหลือเดิม: {student.shirtSize})</p>
              
              {student.proxy_name && (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 mt-2 space-y-1 shadow-sm">
                  <p className="font-bold text-amber-800">👥 รายละเอียดผู้รับแทน:</p>
                  <p className="text-slate-700">• ชื่อผู้รับแทน: {student.proxy_name}</p>
                  {student.proxy_student_id && <p className="text-slate-700">• รหัสนักศึกษา: {student.proxy_student_id}</p>}
                  {student.proxy_phone && <p className="text-slate-700">• เบอร์โทรติดต่อ: {student.proxy_phone}</p>}
                </div>
              )}
            </div>

            <button 
              onClick={handleRevoke}
              disabled={isSubmitting}
              className="w-full mt-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <XCircle size={16} /> {isTH ? 'ยกเลิกรายการนี้' : 'Revoke Item'}
            </button>
          </div>
        ) : (
          /* FORM TO CONFIRM SHIRT PICKUP */
          <div className="space-y-5">
            
            {/* 1. Shirt Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Shirt size={16} className="text-indigo-600" /> ไซซ์เสื้อที่แจกจริง:
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  ไซซ์ที่ลงทะเบียนไว้: <b className="text-amber-800 text-xs sm:text-sm font-black font-mono">{registeredSize}</b>
                </span>
              </div>

              {/* Size Buttons Selector */}
              <div className="grid grid-cols-5 gap-2">
                {SHIRT_SIZES.map((size) => {
                  const isSelected = selectedSize === size;
                  const isOriginal = registeredSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all border cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-md scale-105 font-black' 
                          : isOriginal 
                            ? 'bg-amber-50 text-amber-900 border-2 border-amber-300 hover:bg-amber-100 font-bold'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-semibold'
                      }`}
                    >
                      {size}
                      {isOriginal && <span className="block text-[9px] font-normal leading-none opacity-80">(จอง)</span>}
                    </button>
                  );
                })}
              </div>

              {/* Warning if size changed */}
              {isSizeChanged && (
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>{isTH ? `แจ้งเตือน: กำลังมอบเสื้อไซซ์ ${selectedSize} (ต่างจากไซซ์ที่จองไว้เดิม ${registeredSize})` : `Notice: Assigning size ${selectedSize} (Original size: ${registeredSize})`}</span>
                </div>
              )}
            </div>

            {/* 2. Proxy Pickup Toggle */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <User size={16} className="text-indigo-600" />
                  <span>ผู้รับมอบเสื้อ:</span>
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setIsProxy(false); setProxyName(''); setProxyStudentId(''); setProxyPhone(''); }}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      !isProxy ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    {isTH ? 'รับด้วยตนเอง' : 'Self Pickup'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProxy(true)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                      isProxy ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    {isTH ? 'มีผู้รับแทน' : 'Proxy Pickup'}
                  </button>
                </div>
              </div>

              {/* Proxy Pickup Details Box */}
              {isProxy && (
                <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3 shadow-sm">
                  <span className="text-xs font-extrabold text-amber-900 block">👥 ระบุข้อมูลผู้รับแทน:</span>

                  {/* Mode Buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowProxyScanModal(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-amber-200/70 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <QrCode size={15} /> สแกน QR / Short Code
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProxyType('MANUAL_INPUT'); }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        proxyType === 'MANUAL_INPUT' ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      กรอกรหัสมือ
                    </button>
                  </div>

                  {/* Proxy Info Display / Manual Inputs */}
                  {proxyType === 'MANUAL_INPUT' ? (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">รหัสนักศึกษาผู้รับแทน 11 หลัก *</label>
                        <input
                          type="text"
                          maxLength={11}
                          value={proxyStudentId}
                          onChange={(e) => handleManualProxyChange(e.target.value, proxyPhone)}
                          placeholder="69070500002"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ผู้รับแทน *</label>
                        <input
                          type="tel"
                          value={proxyPhone}
                          onChange={(e) => handleManualProxyChange(proxyStudentId, e.target.value)}
                          placeholder="0898765432"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    proxyName ? (
                      <div className="p-3 rounded-xl bg-white border border-emerald-300 text-xs space-y-1 shadow-sm">
                        <p className="font-black text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={14} /> ข้อมูลผู้รับแทนจากระบบ:
                        </p>
                        <p className="text-slate-800 font-bold">• ชื่อ-นามสกุล: {proxyName}</p>
                        <p className="text-slate-600 font-mono">• รหัสนักศึกษา: {proxyStudentId}</p>
                        {proxyPhone && <p className="text-slate-600 font-mono">• เบอร์โทร: {proxyPhone}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-900 font-medium italic text-center py-1">
                        * กดปุ่ม "สแกน QR / Short Code" เพื่อเลือกผู้รับแทนจากระบบ
                      </p>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Confirm Submit Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer mt-3 shadow-xl hover:shadow-2xl transition-all active:scale-[0.99]"
            >
              <CheckCircle2 size={18} /> ยืนยันการรับมอบเสื้อ
            </button>

          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 text-center space-y-4 shadow-2xl text-slate-800">
            <h3 className="text-lg font-black text-slate-900">ยืนยันการรับเสื้อ</h3>
            
            <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left font-medium">
              <p>👤 <b>ผู้รับเสื้อ:</b> {student.firstName} {student.lastName}</p>
              <p>🆔 <b>รหัสนักศึกษา:</b> {formatStudentId(student.studentId || student.id)}</p>
              <p>👕 <b>ไซซ์เสื้อที่จะมอบ:</b> <span className="font-black text-amber-700 text-sm">{selectedSize}</span></p>
              {isProxy && <p>👥 <b>ผู้รับแทน:</b> {proxyName || proxyStudentId || 'ระบุผู้รับแทน'}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center justify-center gap-1 shadow-lg cursor-pointer"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'ยืนยันบันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm border border-slate-200 text-center space-y-4 shadow-2xl text-slate-800">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={38} />
            </div>
            <h3 className="text-xl font-black text-slate-900">บันทึกรับเสื้อสำเร็จ!</h3>
            <p className="text-xs text-slate-600 font-medium">ข้อมูลถูกอัปเดตไปยังระบบและบันทึกประวัติเรียบร้อยแล้ว</p>
            
            <button
              onClick={() => { setShowSuccessModal(false); navigate('/scan'); }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg cursor-pointer"
            >
              สแกนคนถัดไป
            </button>
          </div>
        </div>
      )}

      {/* PROXY SCANNER MODAL */}
      {showProxyScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-200 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">สแกน QR / ค้นหาผู้รับแทน</h3>
              <button onClick={() => setShowProxyScanModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle size={22} />
              </button>
            </div>

            {/* Camera Frame */}
            <div className="w-full aspect-square max-h-[240px] bg-slate-900 rounded-2xl border border-slate-300 relative overflow-hidden flex items-center justify-center shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-4 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none"></div>
            </div>

            {/* Short Code Input for Proxy */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs text-slate-600 font-semibold text-center">หรือพิมพ์ Short Code ของผู้รับแทน</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={proxyCodeInput}
                  onChange={(e) => setProxyCodeInput(e.target.value.toUpperCase())}
                  placeholder="CP02"
                  className="flex-1 px-3.5 py-2.5 text-center font-mono font-black text-base rounded-xl bg-slate-100 border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => handleProxyLookup(proxyCodeInput, 'SHORT_CODE')}
                  className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 cursor-pointer shadow-sm"
                >
                  ตกลง
                </button>
              </div>
              {proxyError && <p className="text-red-500 text-xs font-bold text-center mt-1">{proxyError}</p>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
