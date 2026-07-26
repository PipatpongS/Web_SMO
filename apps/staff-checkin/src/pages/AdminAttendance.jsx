import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, DEPT_ALIASES, DEPT_TRANSLATIONS_TH, DEPT_TRANSLATIONS_EN } from '../contexts/FirebaseDataContext';
import { ArrowLeft, Calendar, Users, CheckCircle, XCircle, Search, RefreshCw, Hash, User, Clock, Building2 } from 'lucide-react';

const formatCheckinTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
  } catch { return isoString; }
};

const DEPTS = ['ALL', ...Object.keys(DEPT_ALIASES)];

export default function AdminAttendance() {
  const navigate = useNavigate();
  const { students, lang, fetchStudentsFromFirestore, isRefreshing, lastUpdatedText } = useData();
  const isTH = lang === 'TH';

  const [selectedDay, setSelectedDay] = useState('1'); // '1' | '2'
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'checked' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const PAGE_SIZE = 8;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => { setDisplayCount(PAGE_SIZE); }, [searchQuery, statusFilter, selectedDept, selectedDay]);

  const matchDept = (studentDeptRaw, code) => {
    if (!code || code === 'ALL') return true;
    if (!studentDeptRaw) return false;
    const raw = String(studentDeptRaw).toUpperCase().trim();
    const aliases = DEPT_ALIASES[code] || [code];
    return aliases.some(a => raw.includes(a.toUpperCase()));
  };

  const getDeptLabel = (code) => {
    if (code === 'ALL') return isTH ? 'ทุกภาควิชา' : 'All Departments';
    return isTH ? (DEPT_TRANSLATIONS_TH?.[code] || code) : (DEPT_TRANSLATIONS_EN?.[code] || code);
  };

  // ─── Filter pipeline ───────────────────────────────────────────────────────
  const deptFiltered = useMemo(() =>
    students.filter(s => matchDept(s.department, selectedDept))
  , [students, selectedDept]);

  const isChecked = (s) => selectedDay === '1' ? !!s.checkin_day1_morning : !!s.checkin_day2_morning;

  const totalCount = deptFiltered.length;
  const checkedCount = deptFiltered.filter(isChecked).length;
  const pendingCount = totalCount - checkedCount;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const filteredStudents = useMemo(() => {
    return deptFiltered.filter(s => {
      const chk = isChecked(s);
      if (statusFilter === 'checked' && !chk) return false;
      if (statusFilter === 'pending' && chk) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const fn = (s.firstName || s.first_name || '').toLowerCase();
        const ln = (s.lastName || s.last_name || '').toLowerCase();
        const sid = String(s.studentId || s.id || '').toLowerCase();
        const sc = String(s.short_code || s.shortCode || s.walkin_temp_short_code || '').toLowerCase();
        const dept = String(s.department || '').toLowerCase();
        return `${fn} ${ln}`.includes(q) || fn.includes(q) || ln.includes(q) || sid.includes(q) || sc.includes(q) || dept.includes(q);
      }
      return true;
    });
  }, [deptFiltered, statusFilter, searchQuery, selectedDay]);

  const visible = useMemo(() => filteredStudents.slice(0, displayCount), [filteredStudents, displayCount]);
  const hasMore = displayCount < filteredStudents.length;

  return (
    <div className="w-full flex flex-col items-center justify-start py-4 pb-24 sm:pb-28 px-3 sm:px-4 space-y-4 animate-fadeIn">

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/admin-stats')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft size={16} /> {isTH ? 'กลับ' : 'Back'}
        </button>
        <button
          onClick={() => fetchStudentsFromFirestore(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-xl border border-amber-400/30 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isTH ? 'รีเฟรช' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main White Card */}
      <div className="bg-white text-gray-900 border border-gray-200 shadow-2xl rounded-3xl p-4 sm:p-6 w-full space-y-4">

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-lg sm:text-xl font-black text-gray-900 flex items-center justify-center gap-2">
            <Calendar size={22} className="text-teal-600" />
            {isTH ? 'สถิติเช็คชื่อรายวัน' : 'Daily Attendance Statistics'}
          </h1>

          {/* Last Updated */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gray-100/90 border border-gray-200 text-gray-600 text-[11px] font-semibold">
            <Clock size={13} className="text-teal-600 shrink-0" />
            <span>{isTH ? 'อัปเดตล่าสุด:' : 'Updated:'}</span>
            <span className="font-extrabold text-teal-950">{lastUpdatedText}</span>
          </div>
        </div>

        {/* ── Day Tabs ── */}
        <div className="flex rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {[
            { val: '1', label: isTH ? '📅 Day 1 Morning (25 ก.ค.)' : '📅 Day 1 Morning (Jul 25)' },
            { val: '2', label: isTH ? '📅 Day 2 Morning (26 ก.ค.)' : '📅 Day 2 Morning (Jul 26)' }
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setSelectedDay(tab.val)}
              className={"flex-1 py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer " +
                (selectedDay === tab.val
                  ? 'bg-teal-600 text-white shadow-inner'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Dept Filter ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold shadow-sm shrink-0">
            <Building2 size={14} className="text-blue-700" />
            <span>{isTH ? 'ภาควิชา:' : 'Dept:'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-white border border-blue-300 text-blue-900 font-extrabold rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {DEPTS.map(d => (
                <option key={d} value={d}>{getDeptLabel(d)} {d !== 'ALL' ? `(${d})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div
            onClick={() => setStatusFilter('all')}
            className={"p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none " + (statusFilter === 'all' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-600 shadow-md scale-102' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 opacity-80')}
          >
            <p className="text-[10px] sm:text-xs text-gray-600 font-bold mb-0.5">{isTH ? 'ทั้งหมด' : 'Total'}</p>
            <p className="text-lg sm:text-2xl font-black text-gray-900">
              {totalCount} <span className="text-xs font-normal text-gray-500">{isTH ? 'คน' : 'p'}</span>
            </p>
          </div>
          <div
            onClick={() => setStatusFilter('checked')}
            className={"p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none " + (statusFilter === 'checked' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-600 shadow-md scale-102' : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/80 opacity-80')}
          >
            <p className="text-[10px] sm:text-xs text-emerald-800 font-bold mb-0.5">{isTH ? 'เช็คชื่อแล้ว' : 'Checked'}</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-700">
              {checkedCount} <span className="text-xs font-bold text-emerald-800">({pct}%)</span>
            </p>
          </div>
          <div
            onClick={() => setStatusFilter('pending')}
            className={"p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none " + (statusFilter === 'pending' ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-600 shadow-md scale-102' : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80 opacity-80')}
          >
            <p className="text-[10px] sm:text-xs text-rose-800 font-bold mb-0.5">{isTH ? 'ยังไม่เช็ค' : 'Pending'}</p>
            <p className="text-lg sm:text-2xl font-black text-rose-700">
              {pendingCount} <span className="text-xs font-normal text-gray-500">{isTH ? 'คน' : 'p'}</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Search */}
        <div className="pt-2 border-t border-gray-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTH ? 'ค้นหา ชื่อ-นามสกุล, รหัสนักศึกษา, ภาควิชา...' : 'Search name, student ID, or department...'}
              className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center px-1 text-[11px] font-bold text-gray-500">
            <span>{isTH ? `แสดง ${visible.length} จาก ${filteredStudents.length} รายการ` : `Showing ${visible.length} of ${filteredStudents.length} records`}</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs sm:text-sm font-medium">
              <p>{isTH ? 'ไม่พบข้อมูลนักศึกษาตรงตามเงื่อนไข' : 'No records found'}</p>
            </div>
          ) : (
            visible.map(s => {
              const chk = isChecked(s);
              const checkinTime = selectedDay === '1' ? s.checkin_day1_morning : s.checkin_day2_morning;
              const checkinBy = selectedDay === '1' ? s.checkin_day1_morning_by : s.checkin_day2_morning_by;
              const checkinPic = selectedDay === '1' ? s.checkin_day1_morning_by_staff_pic : s.checkin_day2_morning_by_staff_pic;
              const fullName = `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || 'นักศึกษา';
              const studentId = s.studentId || s.id || '-';
              const shortCode = s.short_code || s.shortCode || s.walkin_temp_short_code || '';
              const dept = s.department || '';

              return (
                <div
                  key={s.docId || s.id}
                  className={"border rounded-2xl p-3 sm:p-3.5 transition-all flex flex-col space-y-2 text-xs sm:text-sm shadow-xs " + (chk ? 'bg-emerald-50/80 border-emerald-200' : 'bg-gray-50 border-gray-200')}
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{fullName}</p>
                        {shortCode && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">#{shortCode}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-blue-700 font-extrabold flex items-center gap-1">
                          <Hash size={12} className="text-blue-500" /> {studentId}
                        </p>
                        {dept && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            <Building2 size={10} className="inline mr-0.5" />
                            {dept}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {chk ? (
                        <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 shadow-xs">
                          <CheckCircle size={14} className="text-emerald-600" /> {isTH ? 'เช็คแล้ว' : 'Checked'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 flex items-center gap-1">
                          <XCircle size={14} className="text-rose-500" /> {isTH ? 'ยังไม่เช็ค' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {chk && (
                    <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 text-[11px] text-emerald-950 font-semibold bg-emerald-100/50 p-2 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {checkinPic ? (
                          <img src={checkinPic} alt="" className="w-5 h-5 rounded-full object-cover border border-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-300">
                            <User size={11} />
                          </div>
                        )}
                        <span className="truncate font-extrabold">{isTH ? 'โดย:' : 'By:'} {checkinBy || 'Staff'}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-emerald-900 shrink-0 bg-emerald-200/60 px-2 py-0.5 rounded-lg border border-emerald-300">
                        <Clock size={12} className="text-emerald-700" />
                        <span>{formatCheckinTime(checkinTime)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {hasMore && (
            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setDisplayCount(prev => prev + PAGE_SIZE)}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isTH ? `โหลดเพิ่ม ${PAGE_SIZE} รายการ (เหลือ ${filteredStudents.length - displayCount})` : `Load ${PAGE_SIZE} More (${filteredStudents.length - displayCount} remaining)`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
