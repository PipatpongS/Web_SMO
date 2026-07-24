import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FirebaseDataProvider, useData, ROLES } from './contexts/FirebaseDataContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockSummary from './pages/StockSummary';
import ScanInput from './pages/ScanInput';
import StudentDetails from './pages/StudentDetails';

// Assets
import bgImg from './assets/bg.jpg';
import logoTop from './assets/Logo.png';
import logoLeft from './assets/b.png';

// Protected Route Component
const ProtectedRoute = ({ children, requireSupervisor = false }) => {
  const { staff } = useData();

  if (!staff) {
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

  useEffect(() => {
    const img = new Image();
    img.src = bgImg;
  }, []);

  const path = location.pathname;
  // StockSummary & StudentDetails are scrollable; StockSummary is the only wide page!
  const isScrollablePage = path === '/stock-summary' || path.startsWith('/student/');
  const isWidePage = path === '/stock-summary';

  const containerWidthClass = isWidePage 
    ? 'max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl' 
    : 'max-w-md sm:max-w-lg';

  const outerWrapperClass = isScrollablePage
    ? 'min-h-screen w-screen font-sans text-white bg-black/40 backdrop-blur-[2px] overflow-y-auto'
    : 'min-h-[100dvh] sm:h-[100dvh] w-screen font-sans text-white bg-black/40 backdrop-blur-[2px] overflow-y-auto sm:overflow-hidden';

  const innerFlexClass = isScrollablePage
    ? 'flex flex-col items-center min-h-screen px-3 sm:px-6 pb-8 relative'
    : 'flex flex-col items-center justify-between min-h-[100dvh] sm:h-full px-3 sm:px-6 pb-4 relative';

  const contentAreaClass = isScrollablePage
    ? 'w-full flex-1 flex flex-col'
    : 'w-full flex-1 flex flex-col justify-center items-center py-2 min-h-0';

  return (
    <div className={outerWrapperClass}>
      <div className={innerFlexClass}>
        {/* Bow Image Fixed at Top-Left */}
        <img 
          src={logoLeft} 
          alt="Bow" 
          className="fixed top-0 left-0 m-0 p-0 w-20 md:w-28 z-50 pointer-events-none" 
        />

        <div className={`w-full ${containerWidthClass} flex flex-col items-center ${isScrollablePage ? 'min-h-screen' : 'min-h-full sm:h-full'} transition-all duration-300`}>
          {/* Top Header Section */}
          <div className="w-full flex justify-center sm:justify-between items-center pt-2 pb-2 px-3 sm:px-4 relative z-10 shrink-0 min-h-[4rem] sm:min-h-[5.5rem]">
            <img 
              src={logoTop} 
              alt="KMUTT ENG Logo" 
              className="h-20 sm:h-28 md:h-36 object-contain drop-shadow-lg" 
            />
            
            {/* Language Switcher Button */}
            <div className="absolute right-3 sm:relative sm:right-auto z-20">
              <button 
                onClick={() => setLang(lang === 'TH' ? 'EN' : 'TH')} 
                className="bg-white/20 hover:bg-white/30 transition-all duration-200 active:scale-75 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm flex items-center cursor-pointer border border-white/10 shrink-0 shadow-sm"
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
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutContent>
      </BrowserRouter>
    </FirebaseDataProvider>
  );
}

export default App;
