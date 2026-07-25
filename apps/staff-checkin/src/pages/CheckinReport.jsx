import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, ROLES, DEPT_ALIASES } from '../contexts/FirebaseDataContext';
import { ArrowLeft, Users, CheckCircle, XCircle, Search, Building2, ChevronDown, RefreshCw, Hash, User, Clock } from 'lucide-react';

const formatCheckinTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins} น.`;
  } catch (e) {
    return isoString;
  }
};

export default function CheckinReport() {
  const navigate = useNavigate();
  const { students, staff, lang, fetchStudentsFromFirestore, isRefreshing, lastUpdatedText } = useData();

  const isTH = lang === 'TH';
  const isSupervisor = staff?.role === ROLES.SUPERVISOR;

  // Selected department filter (defaults to logged-in staff's department, or 'ALL' if Admin)
  const [selectedDept, setSelectedDept] = useState(() => staff?.department || 'ALL');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'checked' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state: Render only 5 records at a time
  const PAGE_SIZE = 5;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Reset pagination count when search, dept, or status filter changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery, statusFilter, selectedDept]);

  // Check if a student document matches a given department code (e.g. 'CPE')
  const matchDepartment = (studentDeptRaw, deptCode) => {
    if (!deptCode || deptCode === 'ALL') return true;
    if (!studentDeptRaw) return false;

    const rawUpper = String(studentDeptRaw).toUpperCase().trim();
    const aliases = DEPT_ALIASES[deptCode] || [deptCode];

    return aliases.some(alias => rawUpper.includes(alias.toUpperCase()));
  };

  // Filter students strictly by department constraint
  const deptFilteredStudents = useMemo(() => {
    const targetDept = selectedDept !== 'ALL' ? selectedDept : (staff?.department || 'ALL');
    return students.filter(s => matchDepartment(s.department, targetDept));
  }, [students, selectedDept, staff?.department]);

  // Compute metrics for the filtered department
  const totalCount = deptFilteredStudents.length;
  const checkedCount = deptFilteredStudents.filter(s => !!s.checkin_day2_morning).length;
  const pendingCount = totalCount - checkedCount;
  const checkedPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Filter list by status & search query
  const filteredStudents = useMemo(() => {
    return deptFilteredStudents.filter(s => {
      const isChecked = !!s.checkin_day2_morning;

      // Status Filter
      if (statusFilter === 'checked' && !isChecked) return false;
      if (statusFilter === 'pending' && isChecked) return false;

      // Search Query (Search by First Name, Last Name, Student ID, or Short Code)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const firstName = (s.firstName || s.first_name || '').toLowerCase();
        const lastName = (s.lastName || s.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        const studentId = String(s.studentId || s.id || '').toLowerCase();
        const shortCode = String(s.short_code || s.shortCode || s.walkin_temp_short_code || '').toLowerCase();

        return fullName.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          studentId.includes(q) ||
          shortCode.includes(q);
      }

      return true;
    });
  }, [deptFilteredStudents, statusFilter, searchQuery]);

  // Paginated records subset (shows 5 items initially)
  const visibleStudents = useMemo(() => {
    return filteredStudents.slice(0, displayCount);
  }, [filteredStudents, displayCount]);

  const hasMore = displayCount < filteredStudents.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + PAGE_SIZE);
  };

  return (
    <div className="w-full flex flex-col items-center justify-start py-4 pb-24 sm:pb-28 px-3 sm:px-4 space-y-4 animate-fadeIn">

      {/* Top Bar with Back Button & Refresh */}
      <div className="w-full flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft size={16} /> {isTH ? 'กลับไปหน้าหลัก' : 'Back to Home'}
        </button>

        <button
          onClick={() => fetchStudentsFromFirestore(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-xl border border-amber-400/30 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isTH ? 'รีเฟรชข้อมูล' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Solid White Card */}
      <div className="bg-white text-gray-900 border border-gray-200 shadow-2xl rounded-3xl p-4 sm:p-6 w-full space-y-4">

        {/* Title & Department Badge */}
        <div className="text-center space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center justify-center gap-2">
            <Users size={22} className="text-blue-600" />
            {isTH ? 'สถิติการลงทะเบียน & รายชื่อนักศึกษา' : 'Registration Stats & Directory'}
          </h2>

          {/* Department Selector for Admin or Badge for Staff & Last Updated Date & Time */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold shadow-sm">
              <Building2 size={15} className="text-blue-700 shrink-0" />
              <span>{isTH ? 'ภาควิชา:' : 'Dept:'}</span>
              {isSupervisor ? (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white border border-blue-300 text-blue-900 font-extrabold rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">{isTH ? 'ทุกภาควิชา (All)' : 'All Departments'}</option>
                  {Object.keys(DEPT_ALIASES).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <span className="font-black text-blue-900 bg-blue-200 px-2.5 py-0.5 rounded-md">
                  {staff?.department || 'CPE'}
                </span>
              )}
            </div>

            {/* Last Updated Date & Time from Firebase */}
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gray-100/90 border border-gray-200 text-gray-600 text-[11px] font-semibold">
              <Clock size={13} className="text-blue-600 shrink-0" />
              <span>{isTH ? 'อัปเดตล่าสุด:' : 'Updated:'}</span>
              <span className="font-extrabold text-blue-950">
                {lastUpdatedText}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Clickable Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">

          {/* Total Students Card */}
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${statusFilter === 'all'
              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-600 shadow-md scale-102'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 opacity-80'
              }`}
          >
            <p className="text-[10px] sm:text-xs text-gray-600 font-bold mb-0.5">{isTH ? 'ทั้งหมด' : 'Total'}</p>
            <p className="text-lg sm:text-2xl font-black text-gray-900">
              {totalCount} <span className="text-xs font-normal text-gray-500">{isTH ? 'คน' : 'p'}</span>
            </p>
          </div>

          {/* Checked In Card */}
          <div
            onClick={() => setStatusFilter('checked')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${statusFilter === 'checked'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-600 shadow-md scale-102'
              : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/80 opacity-80'
              }`}
          >
            <p className="text-[10px] sm:text-xs text-emerald-800 font-bold mb-0.5">{isTH ? 'เช็คชื่อแล้ว' : 'Checked In'}</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-700">
              {checkedCount} <span className="text-xs font-bold text-emerald-800">({checkedPercent}%)</span>
            </p>
          </div>

          {/* Pending Card */}
          <div
            onClick={() => setStatusFilter('pending')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${statusFilter === 'pending'
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-600 shadow-md scale-102'
              : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80 opacity-80'
              }`}
          >
            <p className="text-[10px] sm:text-xs text-rose-800 font-bold mb-0.5">{isTH ? 'ยังไม่เช็คชื่อ' : 'Pending'}</p>
            <p className="text-lg sm:text-2xl font-black text-rose-700">
              {pendingCount} <span className="text-xs font-normal text-gray-500">{isTH ? 'คน' : 'p'}</span>
            </p>
          </div>

        </div>

        {/* Search Input Bar */}
        <div className="pt-2 border-t border-gray-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTH ? 'ค้นหา ชื่อ-นามสกุล, รหัสนักศึกษา หรือ Short Code...' : 'Search Name, Student ID, or Short Code...'}
              className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Student Directory List (Optimized: Renders 5 Items at a Time) */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center px-1 text-[11px] font-bold text-gray-500">
            <span>{isTH ? `แสดง ${visibleStudents.length} จาก ${filteredStudents.length} รายการ` : `Showing ${visibleStudents.length} of ${filteredStudents.length} records`}</span>
            {filteredStudents.length > 0}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs sm:text-sm font-medium">
              <p>{isTH ? 'ไม่พบข้อมูลนักศึกษาตรงตามเงื่อนไข' : 'No student records found'}</p>
            </div>
          ) : (
            visibleStudents.map(s => {
              const isChecked = !!s.checkin_day2_morning;
              const fullName = `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || 'นักศึกษา';
              const studentId = s.studentId || s.id || '-';
              const shortCode = s.short_code || s.shortCode || s.walkin_temp_short_code || '';

              return (
                <div
                  key={s.docId || s.id}
                  className={`border rounded-2xl p-3 sm:p-3.5 transition-all flex flex-col space-y-2 text-xs sm:text-sm shadow-xs ${isChecked
                    ? 'bg-emerald-50/80 border-emerald-200 text-gray-900'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">{fullName}</p>
                        {shortCode && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            #{shortCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-700 font-extrabold flex items-center gap-1">
                        <Hash size={12} className="text-blue-500" /> {studentId}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isChecked ? (
                        <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 shadow-xs">
                          <CheckCircle size={14} className="text-emerald-600" /> {isTH ? 'เช็คชื่อแล้ว' : 'Checked In'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 flex items-center gap-1">
                          <XCircle size={14} className="text-rose-500" /> {isTH ? 'ยังไม่เช็คชื่อ' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checked-in Audit Information (Time, Staff Name, Staff LINE Profile Picture) */}
                  {isChecked && (
                    <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 text-[11px] text-emerald-950 font-semibold bg-emerald-100/50 p-2 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {s.checkin_day2_morning_by_staff_pic ? (
                          <img
                            src={s.checkin_day2_morning_by_staff_pic}
                            alt="LINE Profile"
                            className="w-5 h-5 rounded-full object-cover border border-emerald-400 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-300">
                            <User size={11} />
                          </div>
                        )}
                        <span className="truncate font-extrabold">
                          {isTH ? 'เช็คชื่อโดย:' : 'By:'} {s.checkin_day2_morning_by || 'Staff Operator'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-emerald-900 shrink-0 bg-emerald-200/60 px-2 py-0.5 rounded-lg border border-emerald-300">
                        <Clock size={12} className="text-emerald-700" />
                        <span>{formatCheckinTime(s.checkin_day2_morning)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Load 5 More Button (Optimized Pagination) */}
          {hasMore && (
            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ChevronDown size={16} />
                <span>{isTH ? `โหลดเพิ่มอีก ${PAGE_SIZE} รายการ (เหลือ ${filteredStudents.length - displayCount})` : `Load ${PAGE_SIZE} More (${filteredStudents.length - displayCount} remaining)`}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
