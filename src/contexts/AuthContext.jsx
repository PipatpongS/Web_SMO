import React, { createContext, useState, useEffect, useContext } from 'react';
import liff from '@line/liff';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        // TODO: Replace with actual LIFF ID from env
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID || "MOCK_LIFF_ID" });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setUserProfile(profile);
        } else {
          // For local development testing, mock the user
          if (import.meta.env.DEV) {
             setUserProfile({
               userId: "mock_user_12345",
               displayName: "Mock User",
             });
          } else {
            liff.login();
          }
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
        setError("Failed to initialize LINE LIFF");
        // Mock user for dev if liff init fails
        if (import.meta.env.DEV) {
           setUserProfile({
             userId: "mock_user_12345",
             displayName: "Mock User (Fallback)",
           });
           setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, []);

  return (
    <AuthContext.Provider value={{ userProfile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
