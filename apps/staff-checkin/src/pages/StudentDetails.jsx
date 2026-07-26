import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useData, matchDepartment as matchDeptHelper, formatDepartment as formatDeptHelper } from '../contexts/FirebaseDataContext';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle, XCircle, Shirt, Phone, Loader2, QrCode, User, Hash, Users, ClipboardCheck, Clock } from 'lucide-react';
import jsQR from 'jsqr';

const SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL'];

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') || 'DIRECT';
  const dayParam = searchParams.get('day') || null; // Admin day override (1 or 2)

  const { students, findStudentByCodeDirect, confirmShirtPickup, revokeShirtPickup, approveWalkinRegistration, confirmRegistrationCheckin, lang, staff, matchDepartment: matchDeptContext, formatDepartment: formatDeptContext } = useData();
  const matchDepartment = matchDeptContext || matchDeptHelper;
  const formatDepartment = formatDeptContext || formatDeptHelper;
  const isTH = lang === 'TH';

  const [student, setStudent] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isProxy, setIsProxy] = useState(false);
  const [proxyType, setProxyType] = useState('QR_CODE'); // 'QR_CODE' | 'MANUAL_INPUT'
  const [proxyStudentId, setProxyStudentId] = useState('');
  const [proxyName, setProxyName] = useState('');
  const [proxyPhone, setProxyPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWalkinPending = student?.walkin_status === 'PENDING_APPROVAL' || (student?.note === 'รอบหน้างาน' && !student?.walkin_verified);
  const isWalkinApproved = student?.walkin_status === 'APPROVED' || student?.walkin_verified === true;

  const [alertNoticeModal, setAlertNoticeModal] = useState(null); // { type: 'success' | 'error', title: '', message: '', groupName?: '' }

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProxyScanModal, setShowProxyScanModal] = useState(false);

  // Lock body scrolling whenever any popup/modal is open (iOS & Android robust scroll lock)
  useEffect(() => {
    const isAnyModalOpen = !!(alertNoticeModal || showConfirmModal || showSuccessModal || showProxyScanModal);
    if (isAnyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    };
  }, [alertNoticeModal, showConfirmModal, showSuccessModal, showProxyScanModal]);

  const handleApproveWalkin = async () => {
    if (!student) return;
    setIsSubmitting(true);
    try {
      const res = await approveWalkinRegistration(student);
      if (res.success) {
        const groupName = res.assignedGroupName || res.assignedGroup || '';
        setStudent(prev => ({
          ...prev,
          walkin_status: 'APPROVED',
          walkin_verified: true,
          group: groupName || prev.group
        }));
        setAlertNoticeModal({
          type: 'success',
          title: isTH ? 'อนุมัติการลงทะเบียนเรียบร้อยแล้ว' : 'Registration successfully approved.',
          message: isTH ? 'อนุมัติการลงทะเบียนเรียบร้อยแล้ว' : 'Registration successfully approved.'
        });
      } else {
        setAlertNoticeModal({
          type: 'error',
          title: isTH ? 'เกิดข้อผิดพลาด' : 'Error',
          message: res.error
        });
      }
    } catch (err) {
      console.error("Approve Walk-in error:", err);
      setAlertNoticeModal({
        type: 'error',
        title: isTH ? 'เกิดข้อผิดพลาด' : 'Error',
        message: String(err?.message || err)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [proxyCodeInput, setProxyCodeInput] = useState('');
  const [proxyError, setProxyError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const proxyScanLoopRef = useRef(null);
  const proxyStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsNotFound(false);

    // 1. Render fast local match first if available
    const cachedMatch = students.find(s => s.docId === id || s.id === id || s.studentId === id || (s.short_code && s.short_code.toUpperCase() === id.toUpperCase()));
    if (cachedMatch) {
      setStudent(cachedMatch);
      const regSize = cachedMatch.shirtSize || 'M';
      setSelectedSize(cachedMatch.shirt_size_received || regSize);
      setIsProxy(!!cachedMatch.proxy_name);
      setProxyType(cachedMatch.proxy_type || 'QR_CODE');
      setProxyStudentId(cachedMatch.proxy_student_id || '');
      setProxyName(cachedMatch.proxy_name || '');
      setProxyPhone(cachedMatch.proxy_phone || '');
    }

    // 2. ALWAYS fetch 100% fresh real-time document directly from Firestore
    findStudentByCodeDirect(id, { forceFresh: true }).then(freshMatch => {
      if (!isMounted) return;
      if (freshMatch) {
        setStudent(freshMatch);
        const regSize = freshMatch.shirtSize || 'M';
        setSelectedSize(freshMatch.shirt_size_received || regSize);
        setIsProxy(!!freshMatch.proxy_name);
        setProxyType(freshMatch.proxy_type || 'QR_CODE');
        setProxyStudentId(freshMatch.proxy_student_id || '');
        setProxyName(freshMatch.proxy_name || '');
        setProxyPhone(freshMatch.proxy_phone || '');
        setIsNotFound(false);
      } else if (!cachedMatch) {
        setIsNotFound(true);
      }
    }).catch(err => {
      if (isMounted && !cachedMatch) setIsNotFound(true);
    });

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
  const [firebaseErrorMsg, setFirebaseErrorMsg] = useState(null);

  const handleConfirmSubmit = async () => {
    if (!student) return;
    setIsSubmitting(true);
    setFirebaseErrorMsg(null);

    const payload = {
      studentDocId: student.docId || student.id,
      studentData: student,           // ← pass full object to avoid stale closure
      shirtSizeReceived: selectedSize,
      proxyType: isProxy ? proxyType : null,
      proxyStudentId: isProxy ? proxyStudentId : null,
      proxyName: isProxy ? proxyName : null,
      proxyPhone: isProxy ? proxyPhone : null,
      searchMethod: 'QR_CODE'
    };

    try {
      const res = await confirmShirtPickup(payload);
      if (res && (res === true || res.success)) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        setFirebaseErrorMsg(res?.error || 'ไม่สามารถบันทึกข้อมูลลง Firebase ได้');
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error('confirmShirtPickup error:', err);
      setFirebaseErrorMsg(err?.message || String(err));
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modeParam = searchParams.get('mode');
  const mode = modeParam || (isWalkinPending ? 'walkin' : 'shirt');
  const isWalkinMode = mode === 'walkin';
  const isCheckinMode = mode === 'checkin';
  const searchMethod = searchParams.get('method') || 'DIRECT';

  const handleConfirmCheckin = async () => {
    if (!student) return;
    setIsSubmitting(true);
    setFirebaseErrorMsg(null);

    try {
      const res = await confirmRegistrationCheckin({
        studentDocId: student.docId || student.id,
        studentData: student,
        searchMethod,
        day: dayParam ? Number(dayParam) : undefined  // Admin explicit day
      });

      if (res?.success) {
        const isDay1 = res.isDay1 ?? (dayParam === '1');
        setStudent(prev => ({
          ...prev,
          ...(res.updatePayload || (
            isDay1
              ? { checkin_day1_morning: res.timestamp, checkin_day1_morning_by: res.staffName || prev?.checkin_day1_morning_by }
              : { checkin_day2_morning: res.timestamp, checkin_day2_morning_by: res.staffName || prev?.checkin_day2_morning_by }
          ))
        }));
        setShowConfirmModal(false);
        setShowSuccessModal(true);
      } else {
        setFirebaseErrorMsg(res?.error || 'ไม่สามารถบันทึกการเช็คชื่อลง Firebase ได้');
        setShowConfirmModal(false);
      }
    } catch (err) {
      setFirebaseErrorMsg(err?.message || String(err));
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke Handler
  const handleRevoke = async () => {
    if (!student) return;
    if (!window.confirm(isTH ? 'คุณต้องการยกเลิกการแจกเสื้อรายการนี้ใช่หรือไม่?' : 'Are you sure you want to revoke this shirt pickup?')) return;

    setIsSubmitting(true);
    setFirebaseErrorMsg(null);
    const res = await revokeShirtPickup(student.docId || student.id);
    setIsSubmitting(false);

    if (res && (res === true || res.success)) {
      navigate(`/scan?mode=${mode}`);
    } else {
      setFirebaseErrorMsg(res?.error || 'ไม่สามารถยกเลิกรายการใน Firebase ได้');
    }
  };

  if (!student) {
    if (isNotFound) {
      return (
        <div className="flex flex-col items-center justify-center my-auto p-6 text-center max-w-sm mx-auto glass-panel border border-white/20 rounded-3xl space-y-4 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center">
            <XCircle size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">{isTH ? 'ไม่พบข้อมูลนักศึกษาในระบบ' : 'Student Record Not Found'}</h3>
            <p className="text-xs text-white/70 font-medium">
              {isTH ? 'ไม่พบข้อมูลตรงตามรหัสที่ระบุ กรุณาตรวจสอบรหัสนักศึกษา หรือ Short Code อีกครั้ง' : 'No matching record found. Please verify the Student ID or Short Code.'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/scan?mode=${mode}`)}
            className="w-full py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> {isTH ? 'กลับไปหน้าสแกน/ค้นหา' : 'Back to Search/Scan'}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center my-auto min-h-[300px] text-white">
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
  const isDay1CheckinAccount = (staff?.username || '').toLowerCase() === 'day_1_checkin';
  const isCheckedIn = isDay1CheckinAccount ? !!student.checkin_day1_morning : !!student.checkin_day2_morning;
  const registeredSize = student.shirtSize || 'M';
  const isSizeChanged = selectedSize !== registeredSize;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-start py-4 pb-24 sm:pb-28 px-3 sm:px-4">

      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between mb-3.5 shrink-0">
        <button
          onClick={() => navigate(`/scan?mode=${mode}`)}
          className="text-white hover:bg-white/20 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md transition-all border border-white/20 shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={14} /> {isTH ? 'กลับไปหน้าสแกน' : 'Back to Scan'}
        </button>

        <div className={`text-xs px-3 py-1.5 rounded-full font-bold border flex items-center gap-1.5 shadow-xs ${isWalkinMode
          ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
          : isCheckinMode
            ? 'bg-teal-500/20 text-teal-200 border-teal-400/40'
            : 'bg-purple-500/20 text-purple-200 border-purple-400/40'
          }`}>
          {isWalkinMode ? (
            <>
              <ShieldCheck size={14} className="text-amber-400 shrink-0" />
              <span>{isTH ? 'โหมดอนุมัติ Walk-in' : 'Walk-in Approval Mode'}</span>
            </>
          ) : isCheckinMode ? (
            <>
              <ClipboardCheck size={14} className="text-teal-400 shrink-0" />
              <span>{isTH ? 'โหมดเช็คชื่อลงทะเบียน' : 'Registration Check-in Mode'}</span>
            </>
          ) : (
            <>
              <Shirt size={14} className="text-purple-400 shrink-0" />
              <span>{isTH ? 'โหมดเช็ครับเสื้อ' : 'Shirt Pickup Mode'}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Solid White Content Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 w-full shadow-2xl border border-slate-200/80 text-slate-800 space-y-5 my-auto">

        {/* Student Profile Overview Header */}
        <div className="border-b border-slate-100 pb-4 space-y-3">
          {/* Top Row: Name on Left, Badges on Right */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {student.firstName} {student.lastName}
            </h2>

            {/* Status & Note Badges */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isCheckinMode && (
                isCheckedIn ? (
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 size={13} className="text-teal-600" /> {isTH ? 'เช็คชื่อแล้ว' : 'Checked In'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                    {isTH ? 'ยังไม่ได้เช็คชื่อ' : 'Pending'}
                  </span>
                )
              )}
              {!isWalkinMode && !isCheckinMode && (
                isReceived ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 size={13} className="text-emerald-600" /> {isTH ? 'รับแล้ว' : 'Received'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                    {isTH ? 'ยังไม่ได้รับเสื้อ' : 'Not Received'}
                  </span>
                )
              )}

              {student.note && (student.note.includes('รอบพิเศษ') || student.note.includes('รอบหน้างาน')) && (
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[11px] shadow-xs whitespace-nowrap">
                  {isTH ? `หมายเหตุ: ${student.note}` : `Note: ${student.note}`}
                </span>
              )}
            </div>
          </div>

          {/* Details Section: Spans Full Width of Container */}
          <div className="w-full bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-semibold shrink-0">{isTH ? 'รหัสนักศึกษา:' : 'Student ID:'}</span>
              <span className={`text-slate-900 font-bold text-right truncate ${(student.studentId === '69070500000' || String(student.studentId).includes('ยังไม่ได้รับ')) ? '' : 'font-mono'}`}>
                {formatStudentId(student.studentId || student.id)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-semibold shrink-0">{isTH ? 'ภาควิชา:' : 'Department:'}</span>
              <span className="text-slate-900 font-bold text-right truncate">
                {formatDepartment(student.department, isTH)}
              </span>
            </div>
          </div>
        </div>

        {/* Firebase Error Message Alert Banner */}
        {firebaseErrorMsg && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 mb-4 shadow-md">
            <div className="flex items-center justify-between text-rose-900 font-extrabold text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <XCircle className="text-rose-600 shrink-0" size={20} />
                <span>{isTH ? 'เกิดข้อผิดพลาด (บันทึกไม่สำเร็จ)' : 'Error (Save Failed)'}</span>
              </div>
              <button
                type="button"
                onClick={() => setFirebaseErrorMsg(null)}
                className="text-rose-600 hover:text-rose-800 text-xs font-black px-2 py-0.5 rounded bg-rose-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-rose-800 font-mono bg-rose-100/80 p-2.5 rounded-xl border border-rose-200 leading-relaxed overflow-x-auto">
              {firebaseErrorMsg}
            </p>
          </div>
        )}

        {/* Walk-in Approval Banner Section (ONLY available in Menu 3: Walk-in Approval Mode) */}
        {isWalkinPending && isWalkinMode && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <span>{isTH ? 'รอยืนยันอนุมัติการลงทะเบียนรอบหน้างาน (Walk-in)' : 'Pending Walk-in Registration Approval'}</span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              {isTH
                ? 'นักศึกษายังอยู่ในสถานะรออนุมัติการลงทะเบียนหน้างาน โปรดตรวจบัตรประชาชน/บัตรรอบตรงหน้า แล้วกดปุ่มอนุมัติเพื่อเปิดสิทธิ์ลงทะเบียนฉบับจริง'
                : 'Student is pending on-site registration approval. Please verify ID card and click approve button below.'}
            </p>

            {(() => {
              const isSupervisor = staff?.role === 'STAFF_SUPERVISOR';
              const isWalkinOperator = staff?.role === 'STAFF_WALKIN_OPERATOR';
              const canApproveAnyDept = isSupervisor || isWalkinOperator;
              const isWalkinDeptMismatch = !canApproveAnyDept && staff?.department && !matchDepartment(student?.department, staff.department);

              if (isWalkinDeptMismatch) {
                return (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-1.5 text-xs text-rose-900 font-bold">
                    <p className="flex items-center gap-1.5 text-rose-700 font-extrabold">
                      <XCircle size={16} className="shrink-0" />
                      <span>{isTH ? 'นักศึกษาไม่ได้อยู่ในภาควิชาของคุณ' : 'Student is not in your department'}</span>
                    </p>
                    <p className="text-[11px] text-rose-800 font-normal leading-relaxed">
                      {isTH
                        ? `นักศึกษารายนี้สังกัดภาควิชา ${formatDepartment(student?.department, true)} ไม่ตรงกับภาควิชาที่คุณมีสิทธิ์อนุมัติ (${formatDepartment(staff?.department, true)}) คุณสามารถอนุมัติได้เฉพาะนักศึกษาในภาควิชาของคุณเท่านั้น (บัญชี Walk-in Approval Operator สามารถอนุมัติได้ทุกภาควิชา)`
                        : `This student belongs to ${formatDepartment(student?.department, false)}, which does not match your department (${formatDepartment(staff?.department, false)}). Walk-in approval is limited to your department.`}
                    </p>
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  onClick={handleApproveWalkin}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 size={18} />
                  <span>{isSubmitting ? (isTH ? 'กำลังอนุมัติ...' : 'Approving...') : (isTH ? 'อนุมัติการลงทะเบียน Walk-in (ตรวจบัตรแล้ว)' : 'Approve Walk-in Registration')}</span>
                </button>
              );
            })()}
          </div>
        )}

        {/* Notice for Menu 1 (Check-in Mode) when student is pending Walk-in approval */}
        {isWalkinPending && !isWalkinMode && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 font-bold shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              <span>{isTH ? 'นักศึกษารอยืนยันอนุมัติการลงทะเบียนหน้างาน (อนุมัติได้ที่เมนู 3 อนุมัติ Walk-in เท่านั้น)' : 'Pending Walk-in Approval (Can only be approved in Menu 3 Walk-in Approval)'}</span>
            </div>
          </div>
        )}

        {(isWalkinApproved || (isWalkinMode && student.group)) && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-950 font-black">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                {isTH ? 'อนุมัติการลงทะเบียน Walk-in หน้างานเรียบร้อยแล้ว' : 'Walk-in Registration Approved On-site'}
              </span>
              {student.walkin_approved_by_staff_name && (
                <span className="text-[11px] text-emerald-700 font-medium shrink-0">โดย {student.walkin_approved_by_staff_name}</span>
              )}
            </div>
          </div>
        )}

        {/* REGISTRATION CHECK-IN SECTION */}
        {isCheckinMode && (
          isCheckedIn ? (
            <div className="space-y-3 bg-teal-50/80 p-4 sm:p-5 rounded-2xl border border-teal-200">
              <div className="flex items-center gap-2.5 border-b border-teal-200 pb-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-teal-800 text-sm sm:text-base leading-tight">
                    {isTH ? 'เช็คชื่อลงทะเบียนแล้ว' : 'Checked In'}
                  </h3>
                  <p className="text-[10px] text-teal-600 font-medium">
                    {isTH ? 'บันทึกใน Firebase แล้ว' : 'Recorded in system'}
                  </p>
                </div>
              </div>
              {(() => {
                const dtStr = student.checkin_day2_morning || student.checkin_day1_morning;
                const dt = new Date(dtStr);
                const isValid = dtStr && !isNaN(dt.getTime());
                const dateStr = isValid
                  ? dt.toLocaleDateString(isTH ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })
                  : (dtStr?.split('T')[0] || dtStr);
                const timeStr = isValid
                  ? dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : (dtStr?.split('T')[1] || '').replace(/\.\d+\+.*$/, '').replace(/\+.*$/, '');
                const staffName = student.checkin_day2_morning_by || student.checkin_day1_morning_by;
                const staffPic = student.checkin_day2_morning_by_staff_pic || student.checkin_day1_morning_by_staff_pic;

                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl px-3 py-2.5 border border-teal-100 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                          {isTH ? 'วันที่เช็คชื่อ' : 'Check-in Date'}
                        </p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{dateStr}</p>
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2.5 border border-teal-100 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                          {isTH ? 'เวลาเช็คชื่อ' : 'Check-in Time'}
                        </p>
                        <p className="text-sm font-black text-teal-700 font-mono">{timeStr}</p>
                      </div>
                    </div>

                    {staffName && (
                      <div className="bg-white rounded-xl px-3 py-2.5 border border-teal-100 shadow-sm flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                            {isTH ? 'สตาฟผู้เช็คชื่อ' : 'Checked by'}
                          </p>
                          <div className="flex items-center gap-2">
                            {staffPic ? (
                              <img src={staffPic} alt="Staff" className="w-5 h-5 rounded-full object-cover border border-teal-300 shrink-0" />
                            ) : null}
                            <span className="text-xs font-bold text-slate-800 truncate">{staffName}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (() => {
            const isSupervisor = staff?.role === 'STAFF_SUPERVISOR';
            const isDeptMismatch = !isSupervisor && staff?.department && !matchDepartment(student?.department, staff.department);

            if (isDeptMismatch) {
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-900 font-bold leading-relaxed space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-700 text-sm font-extrabold">
                      <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                      <span>{isTH ? 'นักศึกษาไม่ได้อยู่ในภาควิชาของคุณ' : 'Student is not in your department'}</span>
                    </div>
                    <p className="text-xs text-rose-800 font-medium">
                      {isTH
                        ? `นักศึกษารายนี้สังกัดภาควิชา ${formatDepartment(student?.department, true)} ไม่ตรงกับภาควิชาที่คุณมีสิทธิ์เช็คชื่อ (${formatDepartment(staff?.department, true)})`
                        : `This student belongs to ${formatDepartment(student?.department, false)}, which does not match your department (${formatDepartment(staff?.department, false)}).`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={true}
                    className="w-full py-3.5 sm:py-4 rounded-2xl bg-gray-200 text-gray-500 font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed border border-gray-300 opacity-80"
                  >
                    <XCircle size={18} /> {isTH ? 'นักศึกษาไม่ได้อยู่ในภาควิชาของคุณ' : 'Student is not in your department'}
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-xl transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <ClipboardCheck size={18} /> {isTH ? 'ยืนยันเช็คชื่อลงทะเบียน' : 'Confirm Registration Check-in'}
                </button>
              </div>
            );
          })()
        )}

        {/* SHIRT PICKUP SECTION (Only visible in Shirt Pickup Mode, hidden in Walk-in Approval Mode) */}
        {!isWalkinMode && !isCheckinMode && (
          isReceived ? (
            <div className="space-y-3 bg-emerald-50/80 p-4 sm:p-5 rounded-2xl border border-emerald-200">
              {/* Header */}
              <div className="flex items-center gap-2.5 border-b border-emerald-200 pb-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-emerald-800 text-sm sm:text-base leading-tight">
                    {isTH ? 'ประวัติการรับเสื้อเรียบร้อย' : 'Shirt Pickup Completed'}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {isTH ? 'บันทึกข้อมูลในระบบแล้ว' : 'Recorded in system'}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Date & Time */}
                {student.shirt_received_at && (() => {
                  const dtStr = student.shirt_received_at;
                  const dt = new Date(dtStr);
                  const isValid = !isNaN(dt.getTime());
                  const dateStr = isValid
                    ? dt.toLocaleDateString(isTH ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
                    : dtStr.split('T')[0] || dtStr;
                  const timeStr = isValid
                    ? dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : (dtStr.split('T')[1] || '').replace(/\.\d+\+.*$/, '').replace(/\+.*$/, '');
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl px-3 py-2.5 border border-emerald-100 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                          {isTH ? 'วันที่รับ' : 'Received Date'}
                        </p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{dateStr}</p>
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2.5 border border-emerald-100 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">
                          {isTH ? 'เวลาที่รับ' : 'Received Time'}
                        </p>
                        <p className="text-sm font-black text-emerald-700 font-mono">{timeStr}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Shirt Size Received vs Reserved */}
                <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-200 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">
                    {isTH ? 'ไซซ์เสื้อที่ได้รับ' : 'Received Shirt Size'}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-black text-amber-700">{student.shirt_size_received || student.shirtSize}</span>
                    {student.is_shirt_size_changed && student.shirtSize && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                        <Shirt size={11} className="text-amber-500" />
                        <span>จองไว้: <b className="text-amber-700">{student.shirtSize}</b></span>
                      </div>
                    )}
                    {!student.is_shirt_size_changed && student.shirtSize && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        <Shirt size={11} className="text-emerald-500" />
                        <span>ตรงกับที่จอง</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff who distributed */}
                <div className="bg-white rounded-xl px-3 py-2.5 border border-emerald-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">สตาฟฟ์ผู้แจก</p>
                  <div className="flex items-center gap-2.5">
                    {student.shirt_received_by_staff_pic ? (
                      <img
                        src={student.shirt_received_by_staff_pic}
                        alt="Staff"
                        className="w-8 h-8 rounded-full object-cover border-2 border-emerald-300 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center shrink-0">
                        <User size={16} className="text-purple-500" />
                      </div>
                    )}
                    <p className="text-sm font-bold text-slate-800">{student.shirt_received_by_staff_name || 'Staff'}</p>
                  </div>
                </div>

                {/* Proxy info */}
                {student.proxy_name && (
                  <div className="bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-200 shadow-sm space-y-1">
                    <p className="text-[9px] text-blue-400 font-semibold uppercase tracking-wide">รายละเอียดผู้รับแทน</p>
                    <p className="text-xs font-bold text-blue-800">{student.proxy_name}</p>
                    {student.proxy_student_id && <p className="text-[11px] text-slate-600">รหัส: {student.proxy_student_id}</p>}
                    {student.proxy_phone && <p className="text-[11px] text-slate-600">โทร: {student.proxy_phone}</p>}
                  </div>
                )}
              </div>

              <button
                onClick={handleRevoke}
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
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
                        className={`py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all border cursor-pointer ${isSelected
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
                      className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${!isProxy ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold'
                        }`}
                    >
                      {isTH ? 'รับด้วยตนเอง' : 'Self Pickup'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsProxy(true)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-all cursor-pointer ${isProxy ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold'
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
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${proxyType === 'MANUAL_INPUT' ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
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
          )
        )}
      </div>

      {/* CUSTOM CENTER-SCREEN ALERT/NOTICE MODAL */}
      {alertNoticeModal && (
        <div
          className="fixed inset-0 z-50 overflow-hidden p-4 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer select-none touch-none overscroll-none"
          onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAlertNoticeModal(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 text-center space-y-4 shadow-2xl text-slate-800 relative cursor-default transform transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon Header */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md border-2 ${alertNoticeModal.type === 'success'
              ? 'bg-emerald-100 text-emerald-600 border-emerald-300'
              : 'bg-rose-100 text-rose-600 border-rose-300'
              }`}>
              {alertNoticeModal.type === 'success' ? (
                <CheckCircle2 size={36} strokeWidth={2.5} />
              ) : (
                <XCircle size={36} strokeWidth={2.5} />
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-lg font-black text-slate-900 leading-snug">{alertNoticeModal.title}</h3>
              {alertNoticeModal.groupName ? (
                <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-full font-black text-base shadow-xs mt-2">
                  {alertNoticeModal.message}
                </div>
              ) : (
                <p className="text-xs text-slate-600 font-medium">{alertNoticeModal.message}</p>
              )}
            </div>

            {/* Action Dismiss Button */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAlertNoticeModal(null);
                  if (alertNoticeModal.type === 'success') {
                    navigate(`/scan?mode=${mode}`);
                  }
                }}
                className={`w-full py-3 rounded-2xl font-extrabold text-sm shadow-md cursor-pointer transition-colors ${alertNoticeModal.type === 'success'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
              >
                {alertNoticeModal.type === 'success'
                  ? (isTH ? '📷 สแกนอนุมัติคนถัดไป' : 'Scan Next Student')
                  : (isTH ? 'ตกลง / ปิดหน้าต่าง' : 'OK / Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm cursor-pointer select-none touch-none overscroll-none"
          onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl text-slate-800 space-y-5 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-1 border-b border-slate-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isCheckinMode ? 'bg-teal-100' : 'bg-purple-100'}`}>
                {isCheckinMode ? (
                  <ClipboardCheck size={22} className="text-teal-700" />
                ) : (
                  <CheckCircle2 size={22} className="text-purple-700" />
                )}
              </div>
              <div className="text-left">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {isTH
                    ? (isCheckinMode ? 'ยืนยันเช็คชื่อลงทะเบียน' : 'ยืนยันการรับเสื้อ')
                    : (isCheckinMode ? 'Confirm Check-in' : 'Confirm Shirt Pickup')}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isTH ? 'กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน' : 'Please review details before confirming'}
                </p>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <User size={15} className="text-slate-400 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                    {isTH ? (isCheckinMode ? 'ผู้เข้าร่วม' : 'ผู้รับเสื้อ') : (isCheckinMode ? 'Participant' : 'Recipient')}
                  </p>
                  <p className="text-sm font-bold text-slate-800 truncate">{student.firstName} {student.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <Hash size={15} className="text-slate-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                    {isTH ? 'รหัสนักศึกษา' : 'Student ID'}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{formatStudentId(student.studentId || student.id)}</p>
                </div>
              </div>
              {isCheckinMode ? (
                <div className="flex items-center gap-3 bg-teal-50 px-4 py-2.5 rounded-xl border border-teal-200">
                  <Clock size={15} className="text-teal-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] text-teal-500 font-semibold uppercase tracking-wide">
                      {isTH ? 'รอบเช็คชื่อ' : 'Check-in Round'}
                    </p>
                    <p className="text-sm font-black text-teal-700">
                      {isTH ? 'วันที่ 26 ก.ค. 2569' : 'July 26, 2026'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200">
                  <Shirt size={15} className="text-amber-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">
                      {isTH ? 'ไซซ์เสื้อที่จะมอบ' : 'Shirt Size to Hand Over'}
                    </p>
                    <p className="text-lg font-black text-amber-700">{selectedSize}</p>
                  </div>
                </div>
              )}
              {isProxy && (
                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200">
                  <Users size={15} className="text-blue-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">
                      {isTH ? 'ผู้รับแทน' : 'Proxy Recipient'}
                    </p>
                    <p className="text-sm font-bold text-blue-700">{proxyName || proxyStudentId || (isTH ? 'ระบุผู้รับแทน' : 'Proxy specified')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm font-bold cursor-pointer transition-colors disabled:opacity-50"
              >
                {isTH ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={isCheckinMode ? handleConfirmCheckin : handleConfirmSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors disabled:opacity-70 ${isCheckinMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-purple-700 hover:bg-purple-800'
                  }`}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /><span>{isTH ? 'กำลังบันทึก...' : 'Saving...'}</span></>
                ) : (
                  <><CheckCircle2 size={16} /><span>{isTH ? 'ยืนยันบันทึก' : 'Confirm'}</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer select-none touch-none overscroll-none"
          onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuccessModal(false);
              navigate(`/scan?mode=${mode}`);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl p-7 w-full max-w-sm border border-slate-200 text-center space-y-4 shadow-2xl text-slate-800 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={44} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{isTH ? 'บันทึกสำเร็จ' : 'Saved Successfully'}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isTH
                  ? (isCheckinMode ? 'เช็คชื่อลงทะเบียนและบันทึก log เรียบร้อยแล้ว' : 'จ่ายเสื้อและบันทึกข้อมูลเรียบร้อยแล้ว')
                  : (isCheckinMode ? 'Check-in recorded and logged successfully.' : 'Shirt handed over and recorded successfully.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowSuccessModal(false); navigate(`/scan?mode=${mode}`); }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <QrCode size={16} /> {isTH ? 'สแกนคนถัดไป' : 'Scan Next Student'}
            </button>
          </div>
        </div>
      )}

      {/* PROXY SCANNER MODAL */}
      {showProxyScanModal && (
        <div
          className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer select-none touch-none overscroll-none"
          onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProxyScanModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-200 space-y-4 shadow-2xl text-slate-800 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center">
              <h3 className="text-sm font-black text-slate-900 text-center">
                {isTH ? 'สแกน QR / ค้นหาผู้รับแทน' : 'Scan QR / Find Proxy'}
              </h3>
            </div>

            {/* Camera Frame */}
            <div className="w-full aspect-square max-h-[240px] bg-slate-900 rounded-2xl border border-slate-300 relative overflow-hidden flex items-center justify-center shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-4 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none"></div>
            </div>

            {/* Short Code Input for Proxy */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs text-slate-600 font-semibold text-center">
                {isTH ? 'หรือพิมพ์ Short Code ของผู้รับแทน (เช่น W-AB12)' : 'Or enter Proxy Short Code (e.g. W-AB12)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={proxyCodeInput}
                  onChange={(e) => {
                    const inputVal = e.target.value.toUpperCase();
                    if (!inputVal) {
                      setProxyCodeInput('');
                      return;
                    }
                    let clean = inputVal.replace(/[^A-Z0-9]/g, '');
                    if (!clean) {
                      setProxyCodeInput('');
                      return;
                    }
                    if (clean.startsWith('W')) {
                      clean = clean.slice(1);
                    }
                    setProxyCodeInput(`W-${clean.slice(0, 4)}`);
                  }}
                  placeholder="W-AB12"
                  className="flex-1 px-3.5 py-2.5 text-center font-mono font-black text-base rounded-xl bg-slate-100 border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-wider"
                />
                <button
                  onClick={() => handleProxyLookup(proxyCodeInput, 'SHORT_CODE')}
                  className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-300 cursor-pointer shadow-sm"
                >
                  {isTH ? 'ตกลง' : 'OK'}
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
