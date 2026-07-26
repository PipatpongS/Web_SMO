import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/FirebaseDataContext';
import { ArrowLeft, Shirt, BarChart2, CalendarDays, Users } from 'lucide-react';

export default function AdminStats() {
  const navigate = useNavigate();
  const { lang } = useData();
  const isTH = lang === 'TH';

  const cards = [
    {
      id: 'shirt-stock',
      icon: <Shirt size={32} />,
      colorBg: 'bg-purple-500/20',
      colorText: 'text-purple-300',
      colorBorder: 'border-purple-400/40',
      hoverBorder: 'hover:border-purple-400/60',
      hoverText: 'group-hover:text-purple-200',
      title: isTH ? '1. Dashboard สต็อกเสื้อ' : '1. Shirt Stock Dashboard',
      desc: isTH
        ? 'ดูรายงานสต็อกคงเหลือ ยอดรับเสื้อรายขนาด และแบ่งตามภาควิชา'
        : 'View real-time shirt stock balance, size breakdown, and by department',
      route: '/stock-summary'
    },
    {
      id: 'daily-attendance',
      icon: <CalendarDays size={32} />,
      colorBg: 'bg-teal-500/20',
      colorText: 'text-teal-300',
      colorBorder: 'border-teal-400/40',
      hoverBorder: 'hover:border-teal-400/60',
      hoverText: 'group-hover:text-teal-200',
      title: isTH ? '2. สถิติเช็คชื่อรายวัน' : '2. Daily Attendance Statistics',
      desc: isTH
        ? 'ดูยอดเช็คชื่อ Day 1 / Day 2 แยกตามภาควิชา พร้อมตัวกรองวันและแผนก'
        : 'Day 1 / Day 2 attendance stats filtered by day and department',
      route: '/admin-attendance'
    },
    {
      id: 'registration-dir',
      icon: <Users size={32} />,
      colorBg: 'bg-blue-500/20',
      colorText: 'text-blue-300',
      colorBorder: 'border-blue-400/40',
      hoverBorder: 'hover:border-blue-400/60',
      hoverText: 'group-hover:text-blue-200',
      title: isTH ? '3. รายชื่อลงทะเบียน' : '3. Registration Directory',
      desc: isTH
        ? 'ค้นหาและดูรายชื่อนักศึกษาที่ลงทะเบียน แยกตามภาควิชา'
        : 'Search and browse registered students filtered by department',
      route: '/checkin-report'
    }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-start py-4 pb-24 sm:pb-28 px-3 sm:px-4 space-y-4 animate-fadeIn">

      {/* Top Bar */}
      <div className="w-full flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft size={16} />
          {isTH ? 'กลับไปหน้าหลัก' : 'Back to Home'}
        </button>

        <div className="flex items-center gap-1.5 text-amber-300 bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm">
          <BarChart2 size={14} />
          <span>{isTH ? 'ศูนย์สถิติ Admin' : 'Admin Statistics Hub'}</span>
        </div>
      </div>

      {/* Header Card */}
      <div className="w-full glass-panel p-4 sm:p-5 text-center space-y-1 border border-white/20 rounded-3xl shadow-2xl">
        <h1 className="text-lg sm:text-xl font-black text-white flex items-center justify-center gap-2">
          <BarChart2 size={22} className="text-amber-300" />
          {isTH ? 'เลือกรายงานสถิติ' : 'Statistics Reports'}
        </h1>
        <p className="text-xs text-white/60 font-medium">
          {isTH
            ? 'ข้อมูลสถิติแยกตาม 3 ประเภท — เสื้อ / เช็คชื่อรายวัน / รายชื่อลงทะเบียน'
            : '3 report sections — Shirt stock / Daily attendance / Registration directory'}
        </p>
      </div>

      {/* 3 Stat Cards */}
      <div className="w-full space-y-3.5">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => navigate(card.route)}
            className={"w-full glass-panel p-4 sm:p-5 flex items-center gap-4 hover:bg-white/15 transition-all cursor-pointer group text-left shadow-2xl border border-white/20 " + card.hoverBorder + " rounded-3xl"}
          >
            <div className={"p-3.5 rounded-2xl group-hover:scale-110 transition-transform shrink-0 border shadow-inner " + card.colorBg + " " + card.colorText + " " + card.colorBorder}>
              {card.icon}
            </div>
            <div className="space-y-0.5">
              <span className={"text-base sm:text-lg font-black block text-white transition-colors " + card.hoverText}>
                {card.title}
              </span>
              <span className="text-xs text-white/70 block font-medium leading-relaxed">
                {card.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
