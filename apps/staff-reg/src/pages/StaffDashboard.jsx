import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaSync, FaUsers } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Magical colors for charts
  const GENDER_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6']; // Blue, Pink, Purple
  const VERIFY_COLORS = ['#F59E0B', '#10B981']; // Orange, Green
  const DEPT_COLOR = '#FBBF24'; // Magical Gold

  const fetchStats = async () => {
    const authData = sessionStorage.getItem('staff_auth');
    if (!authData) {
      navigate('/staff');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authData}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        if (response.status === 401) {
          sessionStorage.removeItem('staff_auth');
          navigate('/staff');
        } else {
          setError('Failed to fetch data');
        }
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionStorage.getItem('staff_auth')) {
      navigate('/staff');
    }
  }, [navigate]);
  const handleLogout = () => {
    sessionStorage.removeItem('staff_auth');
    navigate('/staff');
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white flex-col space-y-4">
        <span className="w-10 h-10 border-4 border-white/20 border-t-magical-gold rounded-full animate-spin"></span>
        <p className="text-white/60 text-sm">กำลังดึงข้อมูล... (อาจใช้เวลาสักครู่)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4 text-white relative">
      {/* Top Navbar */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/icon.png" alt="SMO Logo" className="w-8 h-8 object-contain" />
          <h1 className="font-bold text-lg hidden sm:block">SMO VIDVA <span className="font-light">| Staff</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchStats}
            className="bg-magical-gold text-black hover:bg-yellow-400 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2"
            disabled={loading}
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:block">{stats ? "Refresh Data" : "Load Data"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 text-red-400"
          >
            <FaSignOutAlt />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>

      {!stats && !loading && !error && (
        <div className="max-w-xl mx-auto px-4 mt-20 text-center">
          <div className="glass-panel p-10 flex flex-col items-center">
            <FaUsers className="w-16 h-16 text-white/20 mb-4" />
            <h2 className="text-xl font-bold mb-2">พร้อมดึงข้อมูลสถิติ</h2>
            <p className="text-white/60 text-sm mb-8">การดึงข้อมูลจะใช้โควต้าการอ่าน (Read Quota) ของ Firestore<br />โปรดกดปุ่มด้านล่างเมื่อต้องการดูอัปเดตล่าสุดเท่านั้น</p>
            <button
              onClick={fetchStats}
              className="bg-magical-gold text-black hover:bg-yellow-400 px-8 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 text-lg"
            >
              <FaSync />
              <span>ดึงข้อมูลล่าสุด</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-center">
            {error}
            <button onClick={fetchStats} className="ml-4 underline hover:text-white">Retry</button>
          </div>
        </div>
      )}

      {stats && (
        <div className="w-full max-w-full mx-auto px-4 sm:px-8 mt-4 space-y-4">

          {/* Total Count Banner */}
          <div className="glass-panel p-4 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-magical-purple/30">
            <div>
              <h2 className="text-white/60 font-medium mb-1 uppercase tracking-wider text-sm">ยอดลงทะเบียนทั้งหมด</h2>
              <div className="text-4xl sm:text-5xl font-extrabold text-white text-glow">
                {stats.total.toLocaleString()} <span className="text-xl sm:text-2xl text-white/70 font-medium">คน</span>
              </div>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
              <FaUsers className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gender Pie Chart */}
            <div className="glass-panel p-4">
              <h3 className="text-lg font-semibold mb-2 text-center">สัดส่วนเพศ (ชาย/หญิง)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                    <Pie
                      data={stats.genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent, value }) => `${name} ${(percent * 100).toFixed(0)}% (${value} คน)`}
                    >
                      {stats.genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Verification Status Pie Chart */}
            <div className="glass-panel p-4">
              <h3 className="text-lg font-semibold mb-2 text-center">สถานะการยืนยันตัวตน</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                    <Pie
                      data={stats.verifyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent, value }) => `${name} ${(percent * 100).toFixed(0)}% (${value} คน)`}
                    >
                      {stats.verifyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={VERIFY_COLORS[index % VERIFY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Department Bar Chart */}
          <div className="glass-panel p-4">
            <h3 className="text-lg font-semibold mb-2 text-center">จำนวนผู้ลงทะเบียน (คน) แยกตามภาควิชา</h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.deptData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: DEPT_COLOR }}
                  />
                  <Bar dataKey="value" name="จำนวน (คน)" fill={DEPT_COLOR} radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="value" position="top" fill="rgba(255,255,255,0.8)" fontSize={12} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
