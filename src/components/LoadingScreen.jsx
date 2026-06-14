import React from 'react';

const LoadingScreen = () => {
  const lang = localStorage.getItem('preferredLang') || 'EN';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]">
      <div className="relative flex items-center justify-center w-44 h-44 mb-6">
        {/* Background Track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-white/10"></div>
        
        {/* Spinning Gradient Border */}
        <div className="absolute inset-0 rounded-full animate-[spin_1.5s_linear_infinite]">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="spinGradientOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(242, 116, 41, 0)" />
                <stop offset="100%" stopColor="#f27429" />
              </linearGradient>
              <linearGradient id="spinGradientGreen" x1="100%" y1="100%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(66, 136, 76, 0)" />
                <stop offset="100%" stopColor="#42884c" />
              </linearGradient>
            </defs>
            {/* Orange line */}
            <path d="M 50 2 A 48 48 0 0 1 98 50" fill="none" stroke="url(#spinGradientOrange)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="98" cy="50" r="4" fill="#f27429" className="drop-shadow-md" />
            
            {/* Green line */}
            <path d="M 50 98 A 48 48 0 0 1 2 50" fill="none" stroke="url(#spinGradientGreen)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="2" cy="50" r="4" fill="#42884c" className="drop-shadow-md" />
          </svg>
        </div>

        {/* Center Image */}
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-2xl z-10">
          <img src="/icon.png" alt="Loading" className="w-[96%] h-[96%] object-contain" />
        </div>
      </div>
      
      <h2 className="text-xl sm:text-2xl font-medium text-white tracking-wider drop-shadow-lg animate-pulse font-sans">
        {lang === 'TH' ? 'โปรดรอสักครู่...' : 'Please wait...'}
      </h2>
    </div>
  );
};

export default LoadingScreen;
