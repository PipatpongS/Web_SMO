import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};
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
  const isReady = imagesLoaded && !authLoading && !regLoading;

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <ScrollToTop />
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
