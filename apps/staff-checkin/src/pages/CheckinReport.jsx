import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockDataContext';
import { ArrowLeft, Users, Sunrise, Sunset, CheckCircle, XCircle, Search, Filter, Building2 } from 'lucide-react';

export default function CheckinReport() {
  const navigate = useNavigate();
  const { students, staff, lang } = useMockData();
  const [activeTab, setActiveTab] = useState('d1m'); // Default active tab: Day 25 Morning
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'checked' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');

  const isTH = lang === 'TH';
  const staffDept = staff?.department || 'วิศวกรรมคอมพิวเตอร์';

  // Filter students strictly by staff department (Staff only sees their own department)
  const deptStudents = students.filter(s => s.department === staffDept);

  const tabs = [
    { id: 'd1m', label: isTH ? '25 ก.ค. (เช้า)' : '25 Jul (AM)', icon: <Sunrise size={16} /> },
    { id: 'd1a', label: isTH ? '25 ก.ค. (บ่าย)' : '25 Jul (PM)', icon: <Sunset size={16} /> },
    { id: 'd2m', label: isTH ? '26 ก.ค. (เช้า)' : '26 Jul (AM)', icon: <Sunrise size={16} /> },
    { id: 'd2a', label: isTH ? '26 ก.ค. (บ่าย)' : '26 Jul (PM)', icon: <Sunset size={16} /> },
  ];

  // Helper to check if student is checked in for current active tab session
  const isCheckedIn = (s) => {
    switch (activeTab) {
      case 'd1m': return s.checkin_day1_morning;
      case 'd1a': return s.checkin_day1_afternoon;
      case 'd2m': return s.checkin_day2_morning;
      case 'd2a': return s.checkin_day2_afternoon;
      default: return false;
    }
  };

  // Stats calculation for the department
  const totalCount = deptStudents.length;
  const checkedCount = deptStudents.filter(s => isCheckedIn(s)).length;
  const pendingCount = totalCount - checkedCount;
  const checkedPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Filter & Search student list
  const filteredStudents = deptStudents.filter(s => {
    const checked = isCheckedIn(s);
    
    // Status Filter
    if (statusFilter === 'checked' && !checked) return false;
    if (statusFilter === 'pending' && checked) return false;

    // Search Query (Search by First Name, Last Name, or Student ID)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const sId = s.id.toLowerCase();
      return fullName.includes(q) || sId.includes(q);
    }

    return true;
  });

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto pr-1 sm:pr-2 pb-8 pt-1 space-y-3 relative scroll-smooth">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')} 
        className="self-start text-white hover:text-white flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all border border-white/30 shadow-md shrink-0 mb-1"
      >
        <ArrowLeft size={18} /> {isTH ? 'กลับไปเมนูหลัก' : 'Back to Main Menu'}
      </button>

      {/* Solid White Card - กรอบขาวทึบเหมือนหน้า Student Details */}
      <div className="bg-white text-gray-900 border border-gray-200 shadow-2xl rounded-3xl p-4 sm:p-6 w-full space-y-4 shrink-0">
        
        {/* Title & Department Badge */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            <Users size={24} className="text-purple-700" />
            {isTH ? 'สรุปยอดการเข้าร่วมกิจกรรม' : 'Attendance Summary'}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold shadow-sm">
            <Building2 size={14} className="text-purple-700" />
            <span>{isTH ? `ภาควิชา: ${staffDept}` : `Dept: ${staffDept}`}</span>
          </div>
        </div>

        {/* Date/Session Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-purple-700 text-white shadow-md border border-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 font-semibold'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 3 Clickable Summary Stat Cards (นักศึกษาทั้งหมด / ลงทะเบียนแล้ว / ยังไม่ได้ลงทะเบียน) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          {/* All Students Filter Button */}
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${
              statusFilter === 'all'
                ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-600 shadow-md scale-102'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 opacity-75 hover:opacity-100'
            }`}
          >
            <p className="text-[10px] sm:text-xs text-gray-700 font-bold mb-0.5">{isTH ? 'ผู้เข้าร่วมทั้งหมด' : 'Total Participants'}</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900">{totalCount} <span className="text-xs font-normal text-gray-500">{isTH ? 'คน' : 'p'}</span></p>
          </div>

          {/* Registered Filter Button */}
          <div 
            onClick={() => setStatusFilter('checked')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${
              statusFilter === 'checked'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-600 shadow-md scale-102'
                : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/80 opacity-75 hover:opacity-100'
            }`}
          >
            <p className="text-[10px] sm:text-xs text-emerald-800 font-bold mb-0.5">{isTH ? 'ลงทะเบียนแล้ว' : 'Registered'}</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-700">
              {checkedCount} <span className="text-xs font-bold text-emerald-800">({checkedPercent}%)</span>
            </p>
          </div>

          {/* Pending Filter Button */}
          <div 
            onClick={() => setStatusFilter('pending')}
            className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer select-none ${
              statusFilter === 'pending'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-600 shadow-md scale-102'
                : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/80 opacity-75 hover:opacity-100'
            }`}
          >
            <p className="text-[10px] sm:text-xs text-rose-800 font-bold mb-0.5">{isTH ? 'ยังไม่ได้ลงทะเบียน' : 'Not Registered'}</p>
            <p className="text-lg sm:text-2xl font-extrabold text-rose-700">{pendingCount} <span className="text-xs font-normal text-gray-500">{isTH ? 'คน' : 'p'}</span></p>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="pt-2 border-t border-gray-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTH ? 'ค้นหาด้วย ชื่อ-นามสกุล หรือ รหัสนักศึกษา' : 'Search by Name or Student ID...'}
              className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm font-sans rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
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

        {/* Student List (Unified Smooth Page Scroll) */}
        <div className="space-y-2 pt-1">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs sm:text-sm font-medium">
              <p>{isTH ? 'ไม่พบข้อมูลนักศึกษาตรงตามเงื่อนไข' : 'No students found matching filters'}</p>
            </div>
          ) : (
            filteredStudents.map(s => {
              const checked = isCheckedIn(s);
              return (
                <div 
                  key={s.id} 
                  className={`border rounded-xl p-3 transition-all flex justify-between items-center text-sm shadow-sm ${
                    checked 
                      ? 'bg-emerald-50/70 border-emerald-200 text-gray-900' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-purple-700 font-mono font-bold tracking-wide">
                      {s.id}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {checked ? (
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1">
                        <CheckCircle size={14} className="text-emerald-600" /> {isTH ? 'ลงทะเบียนแล้ว' : 'Registered'}
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1">
                        <XCircle size={14} className="text-rose-500" /> {isTH ? 'ยังไม่ได้ลงทะเบียน' : 'Not Registered'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
