import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { ArrowLeft, Search, User, Hash, BookOpen, Users, Tag, CheckCircle2, Clock, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

export default function StudentLookup() {
  const navigate = useNavigate();
  const { students, findStudentByCodeDirect, lang, approveWalkinRegistration, formatDepartment } = useData();
  const isTH = lang === 'TH';

  const [searchInput, setSearchInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approveMsg, setApproveMsg] = useState('');

  const GROUP_NAMES_MAP = {
    '1': 'DREAM',
    '2': 'DESIGN',
    '3': 'BUILD',
    '4': 'BLOOM',
    '5': 'BEYOND'
  };

  const GROUP_COLORS_MAP = {
    'DREAM': 'bg-purple-100 text-purple-900 border-purple-300',
    'DESIGN': 'bg-pink-100 text-pink-900 border-pink-300',
    'BUILD': 'bg-amber-100 text-amber-900 border-amber-300',
    'BLOOM': 'bg-emerald-100 text-emerald-900 border-emerald-300',
    'BEYOND': 'bg-cyan-100 text-cyan-900 border-cyan-300'
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setApproveMsg('');
    const queryStr = searchInput.trim();
    if (!queryStr) return;

    setSearched(true);
    // Search direct code or match in students array
    const directResult = findStudentByCodeDirect(queryStr);
    if (directResult) {
      setStudentResult(directResult);
      return;
    }

    const qLower = queryStr.toLowerCase();
    const found = students.find(s => 
      (s.studentId && s.studentId.toLowerCase().includes(qLower)) ||
      (s.short_code && s.short_code.toLowerCase() === qLower) ||
      (s.firstName && s.firstName.toLowerCase().includes(qLower)) ||
      (s.lastName && s.lastName.toLowerCase().includes(qLower)) ||
      (`${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(qLower))
    );

    setStudentResult(found || null);
  };

  const handleApprove = async () => {
    if (!studentResult) return;
    setIsSubmitting(true);
    setApproveMsg('');
    try {
      const res = await approveWalkinRegistration(studentResult.docId || studentResult.id);
      if (res.success) {
        const groupName = res.assignedGroupName || res.assignedGroup || '';
        const updated = {
          ...studentResult,
          walkin_status: 'APPROVED',
          walkin_verified: true,
          group: groupName || studentResult.group
        };
        setStudentResult(updated);
        setApproveMsg(isTH ? 'อนุมัติการลงทะเบียนเรียบร้อยแล้ว' : 'Registration successfully approved.');
      } else {
        setApproveMsg(isTH ? `เกิดข้อผิดพลาด: ${res.error}` : `Error: ${res.error}`);
      }
    } catch (err) {
      setApproveMsg(isTH ? 'เกิดข้อผิดพลาดในการอนุมัติ' : 'Approval error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoundLabel = (note) => {
    if (!note || note === 'รอบปกติ') return isTH ? 'รอบปกติ' : 'Normal Round';
    if (note === 'รอบพิเศษ') return isTH ? 'รอบพิเศษ' : 'Special Round';
    if (note === 'รอบหน้างาน') return isTH ? 'รอบหน้างาน' : 'Walk-in Round';
    return note;
  };

  const getRoundBadgeColor = (note) => {
    if (!note || note === 'รอบปกติ') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (note === 'รอบพิเศษ') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (note === 'รอบหน้างาน') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const formatStudentId = (id) => {
    if (!id) return '-';
    const str = String(id).replace(/\D/g, '');
    if (str.length === 11) {
      return `${str.slice(0, 10)}-${str.slice(10)}`;
    }
    return id;
  };

  const getGroupName = (groupVal) => {
    if (!groupVal) return null;
    const strVal = String(groupVal).trim();
    return GROUP_NAMES_MAP[strVal] || strVal;
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl py-2 px-3 sm:px-4 flex flex-col my-auto space-y-4 animate-fadeIn">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/90 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft size={16} /> {isTH ? 'กลับไปหน้าหลัก' : 'Back to Home'}
        </button>
        <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30">
          {isTH ? '🔍 ค้นหาข้อมูลส่วนตัวน้อง' : 'Student Lookup'}
        </span>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="glass-panel p-4 rounded-3xl border border-white/20 shadow-2xl space-y-3">
        <label className="block text-xs font-extrabold text-white text-glow">
          {isTH ? 'กรอก Short Code, รหัสนักศึกษา หรือ ชื่อ-นามสกุล' : 'Enter Short Code, Student ID, or Name'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={isTH ? 'เช่น W-AB12, 66010001, สมชาย' : 'e.g. W-AB12, 66010001, Somchai'}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white/15 border border-white/25 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl cursor-pointer shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <Search size={16} /> {isTH ? 'ค้นหา' : 'Search'}
          </button>
        </div>
      </form>

      {/* Result Container */}
      {searched && (
        <>
          {studentResult ? (
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-slate-800 space-y-4 animate-fadeIn">
              
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Short Code</span>
                  <span className="text-base font-mono font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 inline-block">
                    #{studentResult.short_code || 'N/A'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug truncate pt-1">
                    {studentResult.firstName} {studentResult.lastName}
                  </h3>
                </div>

                {/* Round Badge */}
                <div className="text-right shrink-0 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">รอบการสมัคร</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-black border inline-block ${getRoundBadgeColor(studentResult.note)}`}>
                    {getRoundLabel(studentResult.note)}
                  </span>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="space-y-2.5 text-xs">
                
                {/* 1. Student ID */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Hash size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{isTH ? 'รหัสนักศึกษา' : 'Student ID'}</p>
                    <p className="text-sm font-mono font-extrabold text-slate-800">{formatStudentId(studentResult.studentId || studentResult.id)}</p>
                  </div>
                </div>

                {/* 2. Department */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{isTH ? 'ภาควิชา' : 'Department'}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{formatDepartment ? formatDepartment(studentResult.department, isTH) : (studentResult.department || 'คณะวิศวกรรมศาสตร์')}</p>
                  </div>
                </div>

                {/* 3. Activity Group (Group Name) */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{isTH ? 'กลุ่มกิจกรรมของน้อง' : 'Assigned Activity Group'}</p>
                    {getGroupName(studentResult.group) ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-base font-black px-3.5 py-1 rounded-xl border shadow-xs ${GROUP_COLORS_MAP[getGroupName(studentResult.group)] || 'bg-amber-100 text-amber-900 border-amber-300'}`}>
                          {getGroupName(studentResult.group)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 italic block mt-0.5">
                        {studentResult.walkin_status === 'PENDING_APPROVAL' || studentResult.note === 'รอบหน้างาน'
                          ? (isTH ? '⚠️ ยังไม่ได้อนุมัติ / ยังไม่ได้รับการสุ่มกลุ่ม' : '⚠️ Pending Approval / Not Grouped')
                          : (isTH ? 'ยังไม่ได้รับการสุ่มกลุ่ม' : 'Not Grouped')}
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Approve Button if Walk-in Pending */}
              {(studentResult.walkin_status === 'PENDING_APPROVAL' || (studentResult.note === 'รอบหน้างาน' && !studentResult.walkin_verified)) && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                    <p className="text-xs text-amber-800 font-bold">
                      {isTH ? 'น้องรายนี้เป็นรอบหน้างานที่ยังไม่ได้อนุมัติ คุณสามารถกดอนุมัติสิทธิ์ทันทีได้ที่นี่' : 'Pending Walk-in registration. Click below to approve and assign group.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /><span>{isTH ? 'กำลังอนุมัติ...' : 'Approving...'}</span></>
                    ) : (
                      <><CheckCircle2 size={18} /><span>{isTH ? 'กดอนุมัติการลงทะเบียน' : 'Approve Registration'}</span></>
                    )}
                  </button>
                </div>
              )}

              {approveMsg && (
                <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 font-extrabold text-xs text-center shadow-xs">
                  {approveMsg}
                </div>
              )}

            </div>
          ) : (
            /* NOT FOUND CARD */
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-3 shadow-2xl text-slate-800 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm border border-rose-200">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{isTH ? 'ไม่พบข้อมูล' : 'Not Found'}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {isTH ? `ไม่พบข้อมูลนักศึกษาด้วยรหัส หรือคำค้นหา "${searchInput}"` : `No student found matching "${searchInput}"`}
                </p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
