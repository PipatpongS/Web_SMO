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
        const liffId = import.meta.env.VITE_LIFF_ID || "2010390110-fPHy5j81";
        await liff.init({ liffId });
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setUserProfile(profile);
        } else {
          liff.login();
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
        setError("Failed to initialize LINE LIFF: " + err.message);
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
