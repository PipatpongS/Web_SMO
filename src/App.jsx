import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegProvider, useRegistration } from './contexts/RegContext';

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

  // 💡 ตัวช่วยสำหรับนักพัฒนา: พิมพ์ ?reset=1 ต่อท้าย URL เพื่อล้าง Cache + รีเซ็ต Rich Menu
  useEffect(() => {
    if (!window.location.search.includes('reset=1')) return;
    if (authLoading) return; // รอ LIFF โหลดเสร็จก่อน

    setIsResetting(true);

    const doReset = async () => {
      // 1. ถ้ามี userId ให้เรียก API ถอดผูก Rich Menu ด้วย
      if (userProfile?.userId) {
        try {
          await fetch('/api/unlink-rich-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userProfile.userId })
          });
        } catch (e) {
          console.error('Unlink rich menu error:', e);
        }
      }

      // 2. ล้าง LocalStorage
      localStorage.clear();
      alert('ล้างข้อมูล LocalStorage + รีเซ็ต Rich Menu สำเร็จแล้ว!');
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
