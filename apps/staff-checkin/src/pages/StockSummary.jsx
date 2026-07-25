import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { 
  BarChart2, Filter, LogOut, ArrowLeft, Clock, ShieldCheck, Shirt, RefreshCw, Search, Edit3, Save, X, CheckCircle2, User 
} from 'lucide-react';

const SHIRT_SIZES = ['SS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL'];

export default function StockSummary() {
  const navigate = useNavigate();
  const { 
    students, 
    staff, 
    logout, 
    lang, 
    isRefreshing, 
    lastUpdatedText, 
    physicalInventory,
    fetchStudentsFromFirestore,
    updatePhysicalInventory
  } = useData();

  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Physical Inventory Modal States
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [stockInputs, setStockInputs] = useState({});
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [stockSaveSuccess, setStockSaveSuccess] = useState(false);

  const isTH = lang === 'TH';

  // Ensure data is fetched on mount
  useEffect(() => {
    fetchStudentsFromFirestore(false);
  }, [fetchStudentsFromFirestore]);

  // Lock body scrolling when modal is open
  useEffect(() => {
    if (showEditStockModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEditStockModal]);

  // Open Edit Stock Modal
  const handleOpenEditStockModal = () => {
    const initial = {};
    SHIRT_SIZES.forEach(sz => {
      initial[sz] = physicalInventory[sz] !== undefined 
        ? physicalInventory[sz] 
        : (stats.reservedSizeCount[sz] || 0);
    });
    setStockInputs(initial);
    setShowEditStockModal(true);
    setStockSaveSuccess(false);
  };

  // Save Physical Stock to Firestore
  const handleSavePhysicalStock = async (e) => {
    e.preventDefault();
    setIsSavingStock(true);
    try {
      const parsedStock = {};
      SHIRT_SIZES.forEach(sz => {
        parsedStock[sz] = Math.max(0, parseInt(stockInputs[sz] || 0, 10));
      });
      await updatePhysicalInventory(parsedStock);
      setStockSaveSuccess(true);
      setTimeout(() => {
        setShowEditStockModal(false);
        setStockSaveSuccess(false);
      }, 1200);
    } catch (err) {
      console.error("Failed to save physical stock:", err);
    } finally {
      setIsSavingStock(false);
    }
  };

  // Get unique departments list
  const departments = useMemo(() => {
    const set = new Set();
    students.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students by Dept and Search
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const sId = (s.studentId || s.id || '').toLowerCase();
        const sc = (s.shortCode || '').toLowerCase();
        return fullName.includes(q) || sId.includes(q) || sc.includes(q);
      }

      return true;
    });
  }, [students, selectedDept, searchQuery]);

  // Metric Aggregations
  const stats = useMemo(() => {
    const totalReg = filteredStudents.length;
    let totalReceived = 0;
    let totalSizeChanged = 0;

    let normalReg = 0, normalReceived = 0, normalSizeMismatch = 0;
    let specialReg = 0, specialReceived = 0, specialSizeMismatch = 0;
    let onsiteReg = 0, onsiteReceived = 0, onsiteSizeMismatch = 0;

    const reservedSizeCount = {};
    const receivedSizeCount = {};

    SHIRT_SIZES.forEach(sz => {
      reservedSizeCount[sz] = 0;
      receivedSizeCount[sz] = 0;
    });

    filteredStudents.forEach(s => {
      const regSz = s.shirtSize || 'M';
      if (reservedSizeCount[regSz] !== undefined) {
        reservedSizeCount[regSz]++;
      }

      const noteStr = s.note || '';
      const isSpecialRound = noteStr.includes('รอบพิเศษ');
      const isOnsiteRound = noteStr.includes('รอบหน้างาน');

      if (isSpecialRound) specialReg++;
      else if (isOnsiteRound) onsiteReg++;
      else normalReg++;

      if (s.shirt_received_at) {
        totalReceived++;
        const recSz = s.shirt_size_received || regSz;
        if (receivedSizeCount[recSz] !== undefined) {
          receivedSizeCount[recSz]++;
        }

        const isMismatch = (recSz !== regSz) || !!s.is_shirt_size_changed;
        if (isMismatch) {
          totalSizeChanged++;
          if (isSpecialRound) specialSizeMismatch++;
          else if (isOnsiteRound) onsiteSizeMismatch++;
          else normalSizeMismatch++;
        }

        if (isSpecialRound) specialReceived++;
        else if (isOnsiteRound) onsiteReceived++;
        else normalReceived++;
      }
    });

    const receivedPercent = totalReg > 0 ? Math.round((totalReceived / totalReg) * 100) : 0;

    const combinedSpecialReg = specialReg + onsiteReg;
    const combinedSpecialReceived = specialReceived + onsiteReceived;
    const combinedSpecialRemaining = combinedSpecialReg - combinedSpecialReceived;
    const combinedSpecialSizeMismatch = specialSizeMismatch + onsiteSizeMismatch;

    return {
      totalReg,
      totalReceived,
      totalRemaining: totalReg - totalReceived,
      totalSizeChanged,
      receivedPercent,
      reservedSizeCount,
      receivedSizeCount,
      // Group breakdowns
      normalReg,
      normalReceived,
      normalRemaining: normalReg - normalReceived,
      normalSizeMismatch,
      specialReg,
      specialReceived,
      specialRemaining: specialReg - specialReceived,
      specialSizeMismatch,
      onsiteReg,
      onsiteReceived,
      onsiteRemaining: onsiteReg - onsiteReceived,
      onsiteSizeMismatch,
      // Combined Special + Onsite
      combinedSpecialReg,
      combinedSpecialReceived,
      combinedSpecialRemaining,
      combinedSpecialSizeMismatch
    };
  }, [filteredStudents]);

  // Recent received students list
  const recentReceived = useMemo(() => {
    return filteredStudents
      .filter(s => s.shirt_received_at)
      .slice(0, 15);
  }, [filteredStudents]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchStudentsFromFirestore(true);
  };

  return (
    <div className="w-full flex flex-col items-center py-4 pb-24 sm:pb-28 space-y-4">
      
      {/* Top Back Navigation Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => navigate('/home')}
          className="text-white hover:text-white flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all border border-white/30 shadow-md cursor-pointer"
        >
          <ArrowLeft size={18} /> {isTH ? 'กลับไปหน้าหลัก' : 'Back to Main Menu'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="text-white/90 hover:text-red-300 flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 transition-all border border-white/15 cursor-pointer"
            title={isTH ? "ออกจากระบบ" : "Log out"}
          >
            <LogOut size={16} /> <span>{isTH ? 'ออกจากระบบ' : 'Log out'}</span>
          </button>
        </div>
      </div>

      {/* Solid White Card Container */}
      <div className="bg-white text-gray-900 border border-gray-200 shadow-2xl rounded-3xl p-5 sm:p-7 w-full space-y-6">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center justify-center sm:justify-start gap-2.5">
              <BarChart2 size={28} className="text-purple-700 shrink-0" />
              <span>{isTH ? 'Dashboard สรุปสต็อกและลงทะเบียนรับเสื้อ' : 'Shirt Stock & Distribution Dashboard'}</span>
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs text-gray-600 font-medium">
              <span className="text-gray-600 font-semibold">
                • {isTH ? 'อัปเดตล่าสุด:' : 'Last Updated:'} <b className="text-gray-900">{lastUpdatedText}</b>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            {/* Edit Physical Stock Button */}
            <button
              onClick={handleOpenEditStockModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md cursor-pointer"
              title={isTH ? "ตั้งค่าจำนวนเสื้อสต็อกในคลังจริง" : "Set physical inventory count"}
            >
              <Edit3 size={15} />
              <span>{isTH ? 'ตั้งค่าสต็อกคลัง' : 'Set Physical Stock'}</span>
            </button>

            {/* Quota-Saving Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 border border-amber-500 text-black text-xs sm:text-sm font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={15} className={`text-black ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? (isTH ? 'กำลังดึง...' : 'Syncing...') : (isTH ? 'ดึงข้อมูลล่าสุด' : 'Sync Latest')}</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-inner">
          {/* Department Filter Selector */}
          <div className="sm:col-span-1 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
              <Filter size={15} className="text-purple-700" /> {isTH ? 'เลือกภาควิชา:' : 'Department:'}
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold shadow-sm cursor-pointer w-full"
            >
              <option value="ALL">{isTH ? 'ทั้งหมด (ทุกภาควิชา)' : 'All Departments'}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
              <Search size={15} className="text-purple-700" /> {isTH ? 'ค้นหานักศึกษา:' : 'Search Student:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTH ? "ค้นหาด้วย ชื่อ, รหัสนักศึกษา 11 หลัก, หรือ Short Code..." : "Search by Name, Student ID, or Short Code..."}
                className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm"
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
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
            <span className="text-xs sm:text-sm font-extrabold text-gray-600 uppercase block mb-1">
              {isTH ? 'ลงทะเบียนรวม' : 'Total Registered'}
            </span>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center justify-center gap-1.5">
              <span>{stats.totalReg}</span>
              <span className="text-xl sm:text-2xl font-bold">{isTH ? 'คน' : 'students'}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-sm relative overflow-hidden">
            <span className="text-xs sm:text-sm font-extrabold text-emerald-800 uppercase block mb-1">
              {isTH ? 'รับแล้ว' : 'Received'}
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 flex items-center justify-center gap-1.5">
              <span>{stats.totalReceived}</span>
              <span className="text-xl sm:text-2xl font-bold">{isTH ? 'คน' : ''}</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600">({stats.receivedPercent}%)</span>
            </p>
            <div className="w-full bg-emerald-200 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${stats.receivedPercent}%` }}></div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-sm">
            <span className="text-xs sm:text-sm font-extrabold text-amber-800 uppercase block mb-1">
              {isTH ? 'ยังไม่ได้รับ' : 'Pending Pickup'}
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-700 flex items-center justify-center gap-1.5">
              <span>{stats.totalRemaining}</span>
              <span className="text-xl sm:text-2xl font-bold">{isTH ? 'คน' : 'students'}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 shadow-sm">
            <span className="text-xs sm:text-sm font-extrabold text-purple-800 uppercase block mb-1">
              {isTH ? 'รับไม่ตรงไซซ์ที่จอง' : 'Size Mismatch'}
            </span>
            <p className="text-2xl sm:text-3xl font-black text-purple-700 flex items-center justify-center gap-1.5">
              <span>{stats.totalSizeChanged}</span>
              <span className="text-xl sm:text-2xl font-bold">{isTH ? 'คน' : 'students'}</span>
            </p>
          </div>
        </div>

        {/* Sum Breakdown Panel: รอบปกติ VS รอบพิเศษ VS รอบหน้างาน VS รวมรอบพิเศษ+หน้างาน */}
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <h3 className="text-xs sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Filter size={18} className="text-purple-700" />
            <span>{isTH ? 'สรุปยอดจำแนกตามกลุ่ม (รอบปกติ / รอบพิเศษ / รอบหน้างาน)' : 'Breakdown by Group (Normal / Special / On-site)'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Group 1: รอบปกติ */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  {isTH ? 'รอบปกติ' : 'Regular Round'}
                </span>
                <span className="text-xs font-black text-slate-700">
                  {stats.normalReg} {isTH ? 'คน' : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-emerald-100/70 border border-emerald-200 p-2 rounded-xl">
                  <span className="text-emerald-800 font-bold block text-[10px]">{isTH ? 'รับแล้ว' : 'Received'}</span>
                  <span className="font-black text-emerald-900 text-sm">{stats.normalReceived}</span>
                </div>
                <div className="bg-amber-100/70 border border-amber-200 p-2 rounded-xl">
                  <span className="text-amber-800 font-bold block text-[10px]">{isTH ? 'ยังไม่ได้รับ' : 'Pending'}</span>
                  <span className="font-black text-amber-900 text-sm">{stats.normalRemaining}</span>
                </div>
                <div className="bg-purple-100/70 border border-purple-200 p-2 rounded-xl">
                  <span className="text-purple-800 font-bold block text-[10px]">{isTH ? 'ไม่ตรงไซซ์' : 'Mismatch'}</span>
                  <span className="font-black text-purple-900 text-sm">{stats.normalSizeMismatch}</span>
                </div>
              </div>
            </div>

            {/* Group 2: รอบพิเศษ */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <span className="font-extrabold text-purple-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  {isTH ? 'รอบพิเศษ' : 'Special Round'}
                </span>
                <span className="text-xs font-black text-purple-800">
                  {stats.specialReg} {isTH ? 'คน' : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-emerald-100/70 border border-emerald-200 p-2 rounded-xl">
                  <span className="text-emerald-800 font-bold block text-[10px]">{isTH ? 'รับแล้ว' : 'Received'}</span>
                  <span className="font-black text-emerald-900 text-sm">{stats.specialReceived}</span>
                </div>
                <div className="bg-amber-100/70 border border-amber-200 p-2 rounded-xl">
                  <span className="text-amber-800 font-bold block text-[10px]">{isTH ? 'ยังไม่ได้รับ' : 'Pending'}</span>
                  <span className="font-black text-amber-900 text-sm">{stats.specialRemaining}</span>
                </div>
                <div className="bg-purple-100/70 border border-purple-200 p-2 rounded-xl">
                  <span className="text-purple-800 font-bold block text-[10px]">{isTH ? 'ไม่ตรงไซซ์' : 'Mismatch'}</span>
                  <span className="font-black text-purple-900 text-sm">{stats.specialSizeMismatch}</span>
                </div>
              </div>
            </div>

            {/* Group 3: รอบหน้างาน */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                <span className="font-extrabold text-indigo-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  {isTH ? 'รอบหน้างาน' : 'On-site Round'}
                </span>
                <span className="text-xs font-black text-indigo-800">
                  {stats.onsiteReg} {isTH ? 'คน' : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-emerald-100/70 border border-emerald-200 p-2 rounded-xl">
                  <span className="text-emerald-800 font-bold block text-[10px]">{isTH ? 'รับแล้ว' : 'Received'}</span>
                  <span className="font-black text-emerald-900 text-sm">{stats.onsiteReceived}</span>
                </div>
                <div className="bg-amber-100/70 border border-amber-200 p-2 rounded-xl">
                  <span className="text-amber-800 font-bold block text-[10px]">{isTH ? 'ยังไม่ได้รับ' : 'Pending'}</span>
                  <span className="font-black text-amber-900 text-sm">{stats.onsiteRemaining}</span>
                </div>
                <div className="bg-purple-100/70 border border-purple-200 p-2 rounded-xl">
                  <span className="text-purple-800 font-bold block text-[10px]">{isTH ? 'ไม่ตรงไซซ์' : 'Mismatch'}</span>
                  <span className="font-black text-purple-900 text-sm">{stats.onsiteSizeMismatch}</span>
                </div>
              </div>
            </div>

            {/* Group 4: Sum รวม (รอบพิเศษ + รอบหน้างาน) */}
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                <span className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-1">
                  ✨ {isTH ? 'รวม (พิเศษ + หน้างาน)' : 'Sum Special + Onsite'}
                </span>
                <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-lg border border-amber-400">
                  {stats.combinedSpecialReg} {isTH ? 'คน' : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-emerald-100/70 border border-emerald-200 p-2 rounded-xl">
                  <span className="text-emerald-800 font-bold block text-[10px]">{isTH ? 'รับแล้ว' : 'Received'}</span>
                  <span className="font-black text-emerald-900 text-sm">{stats.combinedSpecialReceived}</span>
                </div>
                <div className="bg-amber-100/70 border border-amber-200 p-2 rounded-xl">
                  <span className="text-amber-800 font-bold block text-[10px]">{isTH ? 'ยังไม่ได้รับ' : 'Pending'}</span>
                  <span className="font-black text-amber-900 text-sm">{stats.combinedSpecialRemaining}</span>
                </div>
                <div className="bg-purple-100/70 border border-purple-200 p-2 rounded-xl">
                  <span className="text-purple-800 font-bold block text-[10px]">{isTH ? 'ไม่ตรงไซซ์' : 'Mismatch'}</span>
                  <span className="font-black text-purple-900 text-sm">{stats.combinedSpecialSizeMismatch}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Updated 5-Column Size Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Shirt size={18} className="text-purple-700" /> 
              <span>{isTH ? 'สรุปสต็อกและการจ่ายเสื้อแยกตามไซซ์' : 'Real-time Stock Breakdown by Size'}</span>
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 shadow-inner">
            <table className="w-full text-left text-xs sm:text-sm text-gray-900">
              <thead className="bg-gray-100 border-b border-gray-200 text-xs sm:text-sm text-gray-700 uppercase font-extrabold">
                <tr>
                  <th className="p-3.5 sm:p-4">{isTH ? 'ไซซ์' : 'Size'}</th>
                  <th className="p-3.5 sm:p-4 text-center">{isTH ? 'จอง' : 'Reserved'}</th>
                  <th className="p-3.5 sm:p-4 text-center text-purple-900">{isTH ? 'สต็อก' : 'Stock'}</th>
                  <th className="p-3.5 sm:p-4 text-center text-emerald-800">{isTH ? 'รับแล้ว' : 'Received'}</th>
                  <th className="p-3.5 sm:p-4 text-center">{isTH ? 'คงเหลือ' : 'Remaining'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono font-bold">
                {SHIRT_SIZES.map(sz => {
                  const reserved = stats.reservedSizeCount[sz] || 0;
                  const received = stats.receivedSizeCount[sz] || 0;
                  
                  // Physical Initial Stock set by Admin (default = reserved if not set)
                  const physicalTotal = physicalInventory[sz] !== undefined 
                    ? physicalInventory[sz] 
                    : reserved;
                  
                  const physicalRemaining = physicalTotal - received;

                  return (
                    <tr key={sz} className="hover:bg-white transition-colors">
                      <td className="p-3.5 sm:p-4 font-black text-purple-900 text-sm sm:text-base">
                        <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 font-mono">
                          {sz}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-center text-gray-700 text-sm sm:text-base">{reserved}</td>
                      <td className="p-3.5 sm:p-4 text-center font-black text-purple-900 text-sm sm:text-base">
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-200">
                          {physicalTotal}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-center text-emerald-700 font-extrabold text-sm sm:text-base">{received}</td>
                      <td className="p-3.5 sm:p-4 text-center font-extrabold text-sm sm:text-base">
                        <span className={`px-3 py-1 rounded-xl border ${
                          physicalRemaining <= 0 
                            ? 'text-red-700 bg-red-100 border-red-300 animate-pulse' 
                            : physicalRemaining <= 5 
                            ? 'text-amber-800 bg-amber-100 border-amber-300' 
                            : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                        }`}>
                          {physicalRemaining} {physicalRemaining <= 0 ? (isTH ? '(หมด)' : '(Out)') : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Received List */}
        <div className="space-y-4 pt-5 border-t-2 border-purple-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-black text-purple-950 flex items-center gap-2">
              <Clock size={22} className="text-purple-700" /> 
              <span>{isTH ? 'รายการเช็ครับเสื้อล่าสุด' : 'Recent Shirt Check-ins'}</span>
            </h3>
            <span className="text-xs sm:text-sm text-purple-800 font-bold bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              {isTH ? 'แสดง 15 รายการล่าสุด' : 'Showing latest 15 records'}
            </span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {recentReceived.length > 0 ? (
              recentReceived.map((s, idx) => {
                // Formatted Thai Time helper
                const formatCheckedInTime = (isoString) => {
                  if (!isoString) return 'ไม่ระบุเวลา';
                  try {
                    const d = new Date(isoString);
                    if (isNaN(d.getTime())) return isoString;
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    const seconds = String(d.getSeconds()).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                    const month = monthNames[d.getMonth()] || '';
                    return `${day} ${month} เวลา ${hours}:${minutes}:${seconds} น.`;
                  } catch (e) {
                    return isoString;
                  }
                };

                const registeredSize = s.shirtSize || s.shirt_size;
                const receivedSize = s.shirt_size_received || registeredSize;
                const isSizeMismatched = registeredSize && receivedSize && registeredSize !== receivedSize;

                return (
                  <div key={s.docId || s.id || idx} className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-purple-400 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="font-extrabold text-gray-900 text-base sm:text-lg">{s.firstName} {s.lastName}</p>
                        {/* Timestamp Badge */}
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                          <Clock size={15} className="text-purple-600 shrink-0" />
                          <span>{formatCheckedInTime(s.shirt_received_at || s.timestamp)}</span>
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        <span className="font-mono text-slate-500 font-bold">{s.studentId}</span> • <span className="font-extrabold text-purple-800">{s.department}</span>
                      </p>

                      {/* Staff LINE profile */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {s.shirt_received_by_staff_pic ? (
                          <img
                            src={s.shirt_received_by_staff_pic}
                            alt="staff"
                            className="w-5 h-5 rounded-full object-cover border border-gray-300 shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                            <User size={12} className="text-purple-600" />
                          </div>
                        )}
                        <p className="text-xs text-gray-700 font-bold">
                          สตาฟผู้แจก: <span className="text-purple-900 font-extrabold">{s.shirt_received_by_staff_name || 'Staff Operator'}</span>
                        </p>
                      </div>

                      {s.proxy_name && (
                        <div className="inline-flex items-center gap-1 text-xs text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          <span>👤 รับแทนโดย: {s.proxy_name} {s.proxy_student_id ? `(${s.proxy_student_id})` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div className="sm:text-right space-y-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {isSizeMismatched ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-1 text-center sm:text-right">
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-xs inline-block shadow-sm">
                            ⚠️ ไม่ตรงไซซ์
                          </span>
                          <p className="text-xs sm:text-sm font-extrabold text-amber-950">
                            จอง <span className="line-through text-slate-500">{registeredSize}</span> ➔ รับจริง <span className="text-rose-700 text-base sm:text-lg font-black bg-rose-100 px-2 py-0.5 rounded-md">{receivedSize}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-center sm:text-right min-w-[110px]">
                          <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-black text-base sm:text-lg inline-block shadow-sm">
                            {receivedSize || 'M'}
                          </span>
                          <p className="text-xs font-extrabold text-emerald-800 mt-1 flex items-center justify-center sm:justify-end gap-1">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>ตรงไซซ์จอง</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-10 italic bg-gray-50 rounded-2xl border border-gray-200 font-medium">
                {isRefreshing 
                  ? (isTH ? 'กำลังโหลดข้อมูลจาก Firebase...' : 'Syncing data from Firebase...') 
                  : (isTH ? 'ยังไม่มีรายการรับเสื้อในกลุ่มนี้' : 'No shirt check-in records found')}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Modal: Edit Physical Stock Inventory */}
      {showEditStockModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditStockModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl p-6 w-full max-w-lg text-gray-900 shadow-2xl space-y-5 border border-purple-200 animate-in fade-in zoom-in duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center border-b border-gray-200 pb-3">
              <h3 className="text-lg font-black text-purple-900 flex items-center gap-2">
                <Edit3 size={20} className="text-purple-700" />
                <span>{isTH ? 'ตั้งค่าสต็อกเสื้อในคลังจริง' : 'Set Physical Inventory Stock'}</span>
              </h3>
            </div>

            {stockSaveSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto animate-bounce" />
                <p className="text-base font-extrabold text-gray-900">
                  {isTH ? 'บันทึกสต็อกในคลังลง Firebase สำเร็จ!' : 'Physical stock saved to Firebase successfully!'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSavePhysicalStock} className="space-y-4">
                <p className="text-xs text-gray-600 font-medium">
                  {isTH 
                    ? 'กรอกจำนวนเสื้อที่เตรียมไว้ในคลังจริงแยกตามไซซ์ (ระบบจะคำนวณคงเหลือจาก สต็อก - รับแล้ว)' 
                    : 'Enter physical initial stock count per size (Remaining = Stock - Received)'}
                </p>

                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1 p-1">
                  {SHIRT_SIZES.map(sz => (
                    <div key={sz} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                      <label className="text-xs font-black text-purple-900 block text-center">
                        {isTH ? 'ไซซ์' : 'Size'} {sz}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stockInputs[sz] !== undefined ? stockInputs[sz] : ''}
                        onChange={(e) => setStockInputs({ ...stockInputs, [sz]: e.target.value })}
                        className="w-full text-center text-sm font-black font-mono px-2 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                        placeholder="0"
                      />
                      <span className="text-[9px] text-gray-500 block text-center">
                        {isTH ? `จอง: ${stats.reservedSizeCount[sz] || 0} ตัว` : `Reserved: ${stats.reservedSizeCount[sz] || 0}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditStockModal(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    {isTH ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStock}
                    className="px-5 py-2 text-xs sm:text-sm font-extrabold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSavingStock ? (isTH ? 'กำลังบันทึก...' : 'Saving...') : (isTH ? 'บันทึกสต็อกคลัง' : 'Save Stock')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
