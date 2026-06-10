import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { useRegistration } from '../contexts/RegContext';

const Ticket = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { isRegistered, regData, loading } = useRegistration();

  useEffect(() => {
    // BYPASS: Disabled redirect for testing
    // if (!loading && !isRegistered) {
    //   navigate('/'); // If not registered, go back to home
    // }
  }, [loading, isRegistered, navigate]);

  const displayRegData = regData || {
    name: "นายสมมติ ทดสอบระบบ",
    shirtSize: "L"
  };

  // BYPASS: remove loading guard
  // if (loading || !regData) {
  //   return <div className="min-h-screen flex items-center justify-center text-white">กำลังโหลด E-Ticket...</div>;
  // }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-magical-gold text-glow">
          ลงทะเบียนสำเร็จ!
        </h1>
        <p className="text-sm text-white/80 mt-2">โปรดแสดง QR Code นี้แก่สตาฟหน้างาน</p>
      </div>

      <div className="glass-panel p-8 w-full max-w-sm flex flex-col items-center relative overflow-hidden">
        {/* Ticket Top Decorative */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-magical-purple to-magical-light"></div>
        
        <div className="bg-white p-4 rounded-xl mb-6 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          {userProfile?.userId ? (
            <QRCodeSVG 
              value={userProfile.userId} 
              size={200}
              level="H"
              includeMargin={true}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-black">
              ไม่พบ User ID
            </div>
          )}
        </div>

        <div className="w-full space-y-3 text-sm">
          <div className="flex justify-between border-b border-white/20 pb-2">
            <span className="text-white/60">ชื่อ-นามสกุล</span>
            <span className="font-semibold">{displayRegData.name}</span>
          </div>
          <div className="flex justify-between border-b border-white/20 pb-2">
            <span className="text-white/60">ไซส์เสื้อ</span>
            <span className="font-semibold text-magical-gold">{displayRegData.shirtSize}</span>
          </div>
          <div className="flex justify-between border-b border-white/20 pb-2">
            <span className="text-white/60">สถานะ</span>
            <span className="font-semibold text-green-400">พร้อมเข้าร่วมงาน</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
