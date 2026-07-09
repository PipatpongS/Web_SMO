import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';

import bgImg from './assets/bg.jpg';
import logoImg from './assets/Logo.png';
import bImg from './assets/b.png';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Loading Screen
const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0b2e]">
    <div className="flex flex-col items-center">
      <img src={logoImg} alt="SMO VIDVA Logo" className="w-24 h-24 mb-6 drop-shadow-xl animate-pulse" />
      <div className="w-12 h-12 border-4 border-white/20 border-t-magical-gold rounded-full animate-spin"></div>
      <p className="mt-4 text-white/70 font-light tracking-widest text-sm uppercase">Loading Staff Portal...</p>
    </div>
  </div>
);

function AppContent() {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload critical images
  useEffect(() => {
    const imageUrls = [bgImg, logoImg, bImg];
    let loadedCount = 0;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === imageUrls.length) {
        setImagesLoaded(true);
      }
    };

    imageUrls.forEach(url => {
      const img = new Image();
      img.onload = checkAllLoaded;
      img.onerror = checkAllLoaded; // Ensure we don't block forever if an image fails
      img.src = url;
    });
  }, []);

  if (!imagesLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/staff" replace />} />
        <Route path="/staff" element={<StaffLogin />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="*" element={<Navigate to="/staff" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <div className="min-h-screen font-sans text-white">
      {/* Background Image Setup */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat blur-sm scale-105"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      {/* Gray & Blur Overlay */}
      <div className="fixed inset-0 z-[-1] bg-gray-800/60 backdrop-blur-md" />

      <main className="relative z-10 min-h-screen flex flex-col w-full">
        <AppContent />
      </main>
    </div>
  );
}

export default App;
