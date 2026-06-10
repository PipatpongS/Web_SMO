import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RegProvider, useRegistration } from './contexts/RegContext';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Ticket from './pages/Ticket';

import bgImg from './assets/bg.png';

// Guard component to redirect if already registered (BYPASSED)
const PublicRoute = ({ children }) => {
  return children;
};

// Guard component to ensure user is registered to see ticket (BYPASSED)
const ProtectedRoute = ({ children }) => {
  return children;
};

function AppContent() {
  // BYPASS: Ignore authLoading and authError to allow viewing pages without checking LINE status
  const { loading: authLoading, error: authError } = useAuth();

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
          path="/ticket" 
          element={
            <ProtectedRoute>
              <Ticket />
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
        <div 
          className="min-h-screen font-sans text-white bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ backgroundImage: `url(${bgImg})` }}
        >
          <div className="min-h-screen bg-black/40 backdrop-blur-[2px]">
            <AppContent />
          </div>
        </div>
      </RegProvider>
    </AuthProvider>
  );
}

export default App;
