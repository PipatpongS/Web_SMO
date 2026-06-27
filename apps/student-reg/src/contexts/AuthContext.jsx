import React, { createContext, useState, useEffect, useContext } from 'react';
import liff from '@line/liff';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('line_user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  // If we have a cached profile, skip the initial loading screen for instant render!
  const [loading, setLoading] = useState(() => !localStorage.getItem('line_user_profile'));
  const [error, setError] = useState(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LIFF_ID || "2010390110-fPHy5j81";
        
        // Start Firebase Auth State initialization in parallel with LIFF init to save 200-300ms
        const authReadyPromise = auth ? auth.authStateReady() : Promise.resolve();
        
        await liff.init({ liffId });
        
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          
          await authReadyPromise;
          
          if (auth && auth.currentUser && auth.currentUser.uid === profile.userId) {
            // Fast Path: Already signed into Firebase! Skip the slow Vercel API call.
            console.log("Fast Path: Using cached Firebase session");
            setUserProfile(profile);
            localStorage.setItem('line_user_profile', JSON.stringify(profile));
            setLoading(false);
            return;
          }

          const accessToken = liff.getAccessToken();

          try {
            // Point local dev to the deployed Vercel API to get the token
            const apiUrl = import.meta.env.DEV ? 'https://orientation-vidva-bangmod-67-alpha.vercel.app/api/auth' : '/api/auth';
            
            const authResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken })
            });

            if (!authResponse.ok) {
              const errorData = await authResponse.json();
              throw new Error(errorData.error || `Auth API returned ${authResponse.status}`);
            }

            const { customToken } = await authResponse.json();
            
            if (auth) {
              await signInWithCustomToken(auth, customToken);
              console.log("Firebase Auth Custom Sign-in Successful");
            }
          } catch (firebaseErr) {
            console.error("Firebase Custom Auth Error:", firebaseErr);
            setError("ระบบยืนยันตัวตนขัดข้อง กรุณาลองใหม่อีกครั้ง (" + firebaseErr.message + ")");
            setLoading(false);
            return;
          }

          setUserProfile(profile);
          localStorage.setItem('line_user_profile', JSON.stringify(profile));
        } else {
          localStorage.removeItem('line_user_profile');
          liff.login({ redirectUri: window.location.href });
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
        if (err.message === "Load failed") {
          setError("ไม่สามารถเชื่อมต่อกับระบบ LINE ได้ กรุณาปิด AdBlocker, ปิดโหมดลดการติดตาม (Safari Hide IP) หรือสลับไปใช้เน็ตมือถือ (4G/5G) แล้วลองเปิดใหม่อีกครั้ง");
        } else {
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อ LINE: " + err.message);
        }
        localStorage.removeItem('line_user_profile');
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
