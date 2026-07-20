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
import { StaffRegProvider } from './contexts/StaffRegContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import StaffHome from './pages/StaffHome';
import StaffRegister from './pages/StaffRegister';
import StaffProfile from './pages/StaffProfile';
import ActivityDetails from './pages/ActivityDetails';

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
  const { loading: authLoading, userProfile, error: authError } = useAuth();
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

  // Show Loading Screen until Auth, Registration states, AND critical images are fully loaded
  // to prevent flashing of missing images when entering the site.
  const isReady = !authLoading && !regLoading && imagesLoaded;

  if (!isReady) {
    return <LoadingScreen />;
  }

  // If there's an authentication error (e.g. from api/auth.js), block the entire app and show the error!
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black/90">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-red-500/50 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">เกิดข้อผิดพลาดของระบบ</h2>
          <p className="text-red-200 mb-6 text-sm">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
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
        <Route
          path="/activity-details"
          element={
            <ProtectedRoute>
              <ActivityDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <PublicRoute>
              <StaffHome />
            </PublicRoute>
          }
        />
        <Route
          path="/staff/register"
          element={
            <PublicRoute>
              <StaffRegister />
            </PublicRoute>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <ProtectedRoute>
              <StaffProfile />
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
        <StaffRegProvider>
        <div className="min-h-screen font-sans text-white">
          <div className="min-h-screen bg-black/40 backdrop-blur-[2px]">
            <AppContent />
          </div>
        </div>
      </StaffRegProvider>
        </RegProvider>
    </AuthProvider>
  );
}

export default App;
