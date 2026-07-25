import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { ArrowLeft, Clock, History, UserCheck, RefreshCw, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function WalkinLogs() {
  const navigate = useNavigate();
  const { db, students, lang } = useData();
  const isTH = lang === 'TH';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatThaiDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = d.getDate();
      const monthsTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const month = monthsTH[d.getMonth()];
      const year = d.getFullYear() + 543;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    } catch {
      return isoString;
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    let logList = [];

    if (db) {
      try {
        const logsRef = collection(db, 'staff_access_logs');
        const q = query(
          logsRef,
          where('event', '==', 'WALKIN_APPROVED_AND_ASSIGNED_GROUP'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        snap.forEach(docSnap => {
          logList.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (err) {
        console.warn("Firestore query logs note:", err);
      }
    }

    // Fallback if Firestore query empty: parse approved walk-in students from state
    if (logList.length === 0 && students && students.length > 0) {
      const approvedStudents = students
        .filter(s => s.walkin_status === 'APPROVED' && (s.walkin_approved_at || s.updatedAt))
        .sort((a, b) => new Date(b.walkin_approved_at || b.updatedAt) - new Date(a.walkin_approved_at || a.updatedAt))
        .slice(0, 10);

      logList = approvedStudents.map(s => ({
        id: s.docId || s.id,
        timestamp: s.walkin_approved_at || s.updatedAt,
        student_name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        student_id: s.studentId || s.id,
        short_code: s.short_code,
        assigned_group: s.group,
        assigned_group_name: GROUP_NAMES_MAP[String(s.group).trim()] || s.group,
        staff_name: s.walkin_approved_by_staff_name || 'Staff'
      }));
    }

    setLogs(logList);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [db, students]);

  const getGroupName = (log) => {
    if (log.assigned_group_name) return log.assigned_group_name;
    const strGroup = String(log.assigned_group || '').trim();
    return GROUP_NAMES_MAP[strGroup] || strGroup || 'N/A';
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl py-4 pb-24 sm:pb-28 px-3 sm:px-4 flex flex-col space-y-4 animate-fadeIn">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white/90 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft size={16} /> {isTH ? 'กลับไปหน้าหลัก' : 'Back to Home'}
        </button>
        
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-xl border border-amber-400/30 cursor-pointer transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{isTH ? 'รีเฟรช' : 'Refresh'}</span>
        </button>
      </div>

      {/* Header Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 mb-1">
          <History size={26} />
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white text-glow">
          {isTH ? 'ประวัติการอนุมัติ 10 รายการล่าสุด' : 'Recent 10 Approval Logs'}
        </h2>
        <p className="text-xs text-white/70 font-medium">
          {isTH ? 'เรียงลำดับจากรายการอนุมัติใหม่ล่าสุดบนสุด' : 'Sorted with latest approvals on top'}
        </p>
      </div>

      {/* Logs Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 text-white space-y-2">
          <Loader2 size={32} className="animate-spin text-amber-300" />
          <span className="text-xs text-white/70 font-medium">{isTH ? 'กำลังโหลดประวัติการอนุมัติ...' : 'Loading logs...'}</span>
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log, index) => {
            const groupName = getGroupName(log);
            const badgeClass = GROUP_COLORS_MAP[groupName] || 'bg-amber-100 text-amber-900 border-amber-300';
            
            return (
              <div 
                key={log.id || index}
                className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200 text-slate-800 space-y-2.5 transition-all hover:scale-[1.01]"
              >
                {/* Top line: Index badge & Timestamp */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-black bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                    #{index + 1} {index === 0 && (isTH ? 'ใหม่ล่าสุด' : 'Latest')}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={13} className="text-amber-500" />
                    <span>{formatThaiDateTime(log.timestamp)}</span>
                  </span>
                </div>

                {/* Main Content Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        #{log.short_code || log.student_id || 'N/A'}
                      </span>
                      {log.student_id && (
                        <span className="text-xs font-mono text-slate-500 font-semibold">
                          ({log.student_id})
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 truncate pt-0.5">
                      {log.student_name || log.student_doc_id || 'นักศึกษา'}
                    </h3>
                  </div>

                  {/* Group Name Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">{isTH ? 'กลุ่มกิจกรรม' : 'Group'}</span>
                    <span className={`text-sm font-black px-3 py-1 rounded-xl border inline-block mt-0.5 shadow-xs ${badgeClass}`}>
                      {groupName}
                    </span>
                  </div>
                </div>

                {/* Staff Name Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/70">
                  <span>{isTH ? 'ผู้ดำเนินการอนุมัติ:' : 'Approved by:'}</span>
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1">
                    <UserCheck size={12} className="text-purple-600" />
                    <span>{log.staff_name || log.staff_display_name || 'Staff'}</span>
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 text-center text-slate-800 space-y-2 shadow-2xl">
          <History size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-black">{isTH ? 'ยังไม่มีประวัติการอนุมัติ' : 'No Approval Logs Found'}</h3>
          <p className="text-xs text-slate-500 font-medium">
            {isTH ? 'เมื่อมีการกดอนุมัติสิทธิ์ Walk-in ระบบจะแสดงประวัติที่นี่' : 'Approved Walk-in logs will appear here'}
          </p>
        </div>
      )}

    </div>
  );
}
