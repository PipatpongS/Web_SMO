import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegProvider, useRegistration } from './contexts/RegContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';

import bgImg from './assets/bg.jpg';
import logoImg from './assets/Logo.png';
import textHeaderEng from './assets/text-header-eng.png';
import textHeaderThai from './assets/text-header-thai.png';
import LoadingScreen from './components/LoadingScreen';

// Guard component to redirect if already registered (BYPASSED)
const PublicRoute = ({ children }) => {
  return children;
};

// Guard component to ensure user is registered to see ticket (BYPASSED)
const ProtectedRoute = ({ children }) => {
  return children;
};

function AppContent() {
  const { loading: authLoading, userProfile } = useAuth();
  const { loading: regLoading } = useRegistration();
  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  // 💡 ตัวช่วยสำหรับนักพัฒนา: พิมพ์ ?reset=1 ต่อท้าย URL
  // จะทำ 3 อย่างพร้อมกัน: ลบข้อมูล Firebase + ล้าง LocalStorage + รีเซ็ต Rich Menu
  useEffect(() => {
    if (!window.location.search.includes('reset=1')) return;
    if (authLoading) return; // รอ LIFF โหลดเสร็จก่อน
    if (!userProfile) return; // ต้องรอให้ได้ข้อมูล Profile (userId) ก่อนถึงจะลบ Firebase ได้
    if (isResetting) return; // ป้องกันการรันซ้ำ

    setIsResetting(true);

    const doReset = async () => {
      const userId = userProfile.userId;

      if (userId) {
        // 1. ลบข้อมูลใน Firebase Firestore
        try {
          if (db) {
            await deleteDoc(doc(db, 'users', userId));
            console.log('✅ ลบข้อมูลใน Firebase สำเร็จ');
          }
        } catch (e) {
          console.error('Firebase delete error:', e);
        }

        // 2. ถอดผูก Rich Menu กลับเป็นเมนูก่อนลงทะเบียน
        try {
          await fetch('/api/unlink-rich-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          console.log('✅ รีเซ็ต Rich Menu สำเร็จ');
        } catch (e) {
          console.error('Unlink rich menu error:', e);
        }
      }

      // 3. ล้าง LocalStorage
      localStorage.clear();
      alert('รีเซ็ตทั้งหมดสำเร็จ!\n✅ ลบข้อมูล Firebase\n✅ ล้าง LocalStorage\n✅ รีเซ็ต Rich Menu');
      window.location.href = '/';
    };

    doReset();
  }, [authLoading, userProfile]);

  useEffect(() => {
    // Preload critical images
    const imagesToPreload = [bgImg, logoImg, textHeaderEng, textHeaderThai, '/icon.png'];
    let loadedCount = 0;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === imagesToPreload.length) {
        setImagesLoaded(true);
      }
    };

    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = checkAllLoaded;
      img.onerror = checkAllLoaded; // ถ้ารูปพังก็ให้ข้ามไปเลย ระบบจะได้ไม่ค้าง
    });
  }, []);

  // Show Loading Screen until ALL images AND Auth AND Registration states are fully loaded
  const isReady = imagesLoaded && !authLoading && !regLoading && !isResetting;

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <RegProvider>
        <div className="min-h-screen font-sans text-white">
          <div className="min-h-screen bg-black/40 backdrop-blur-[2px]">
            <AppContent />
          </div>
        </div>
      </RegProvider>
    </AuthProvider>
  );
}

export default App;
