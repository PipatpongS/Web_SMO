import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockDataProvider, useMockData } from './contexts/MockDataContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanInput from './pages/ScanInput';
import StudentDetails from './pages/StudentDetails';
import CheckinReport from './pages/CheckinReport';

// Assets
import bgImg from './assets/bg.jpg';
import logoTop from './assets/Logo.png';
import logoLeft from './assets/b.png';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { staff } = useMockData();
  if (!staff) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout with Logos and Language Switcher (Strict 100dvh Non-Scrollable Layout)
const AppLayout = ({ children }) => {
  const { lang, setLang } = useMockData();

  useEffect(() => {
    // Preload background image
    const img = new Image();
    img.src = bgImg;
  }, []);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-screen font-sans text-white bg-black/40 backdrop-blur-[2px] overflow-hidden">
      <div className="flex flex-col items-center h-full px-4 pb-3 overflow-hidden relative">
        {/* Bow Image Fixed at Top-Left */}
        <img 
          src={logoLeft} 
          alt="Bow" 
          className="fixed top-0 left-0 m-0 p-0 w-16 sm:w-20 md:w-24 z-50 pointer-events-none" 
        />

        <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl flex flex-col items-center h-full overflow-hidden">
          {/* Top Header Section: Left-aligned with content card below */}
          <div className="w-full flex justify-between items-center -mt-2 mb-1 relative z-10 shrink-0 min-h-[4rem]">
            <div className="flex justify-center sm:justify-start items-center w-full sm:w-auto">
              <img 
                src={logoTop} 
                alt="KMUTT ENG Logo" 
                className="h-24 sm:h-32 md:h-36 object-contain drop-shadow-lg" 
              />
            </div>
            
            {/* Language Switcher Button */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 z-20">
              <button 
                onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} 
                className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer border border-white/10 shrink-0"
              >
                <span className="mr-1">🌐</span> 
                <span className="w-6 text-center inline-block">{lang}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area (Fills remaining height) */}
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/scan" element={
              <ProtectedRoute>
                <ScanInput />
              </ProtectedRoute>
            } />
            
            <Route path="/student/:id" element={
              <ProtectedRoute>
                <StudentDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/report" element={
              <ProtectedRoute>
                <CheckinReport />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </MockDataProvider>
  );
}

export default App;
