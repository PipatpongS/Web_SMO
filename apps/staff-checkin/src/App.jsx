import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FirebaseDataProvider, useData, ROLES } from './contexts/FirebaseDataContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockSummary from './pages/StockSummary';
import ScanInput from './pages/ScanInput';
import StudentDetails from './pages/StudentDetails';
import StudentLookup from './pages/StudentLookup';
import CheckinReport from './pages/CheckinReport';

// Assets
import bgImg from './assets/bg.jpg';
import logoTop from './assets/Logo.png';
import logoLeft from './assets/b.png';

// Protected Route Component — Strictly requires both Staff Auth AND LINE Auth (liffProfile)
const ProtectedRoute = ({ children, requireSupervisor = false }) => {
  const { staff, liffProfile, liffLoading, logout } = useData();

  if (liffLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-white">
        <div className="w-10 h-10 border-4 border-amber-300 border-t-transparent rounded-full animate-spin mb-3"></div>
      </div>
    );
  }

  // If not logged in to staff OR not logged in to LINE → kick out to login page!
  if (!staff || !liffProfile) {
    if (staff && !liffLoading) {
      logout();
    }
    return <Navigate to="/" replace />;
  }

  if (requireSupervisor && staff.role !== ROLES.SUPERVISOR) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Inner Layout Content wrapper with dynamic max width and non-scrollable home page option
const LayoutContent = ({ children }) => {
  const { lang, setLang } = useData();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    const img = new Image();
    img.src = bgImg;
  }, []);

  const isWidePage = path === '/stock-summary';

  const containerWidthClass = isWidePage 
    ? 'max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl' 
    : 'max-w-md sm:max-w-lg';

  const outerWrapperClass = 'min-h-[100dvh] w-screen font-sans text-white bg-black/40 backdrop-blur-[2px] overflow-y-auto overflow-x-hidden';

  const innerFlexClass = 'flex flex-col items-center min-h-[100dvh] px-3 sm:px-6 pb-28 sm:pb-32 relative';

  const contentAreaClass = 'w-full flex-1 flex flex-col items-center justify-start py-2';

  return (
    <div className={outerWrapperClass}>
      <div className={innerFlexClass}>
        {/* Bow Image Fixed at Top-Left */}
        <img 
          src={logoLeft} 
          alt="Bow" 
          className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" 
        />

        <div className={`w-full ${containerWidthClass} flex flex-col items-center min-h-full transition-all duration-300`}>
          {/* Top Header Section */}
          <div className="w-full flex justify-center lg:justify-start items-center -mt-6 sm:-mt-8 -mb-3 sm:-mb-5 relative z-10 shrink-0 min-h-[4rem] text-white">
            <div className="flex items-center z-10">
              <img 
                src={logoTop} 
                alt="KMUTT ENG Logo" 
                className="h-24 sm:h-32 md:h-36 object-contain drop-shadow-lg" 
              />
            </div>
            
            {/* Language Switcher Button */}
            <div className="absolute right-0 z-20">
              <button 
                onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} 
                type="button"
                className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer text-white border border-white/10 shadow-sm"
              >
                <span className="mr-1">🌐</span> 
                <span className="w-6 text-center inline-block">{lang}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className={contentAreaClass}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <FirebaseDataProvider>
      <BrowserRouter>
        <LayoutContent>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            
            <Route path="/home" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/stock-summary" element={
              <ProtectedRoute requireSupervisor={true}>
                <StockSummary />
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

            <Route path="/student-lookup" element={
              <ProtectedRoute>
                <StudentLookup />
              </ProtectedRoute>
            } />
            
            <Route path="/checkin-report" element={
              <ProtectedRoute>
                <CheckinReport />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutContent>
      </BrowserRouter>
    </FirebaseDataProvider>
  );
}

export default App;
