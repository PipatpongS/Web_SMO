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
          const accessToken = liff.getAccessToken();

          try {
            // Check if we are running locally vs deployed for the API URL
            const apiUrl = import.meta.env.DEV ? 'http://localhost:3000/api/auth' : '/api/auth';
            
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
            
            // Import auth dynamically to avoid circular dependencies if any
            const { signInWithCustomToken } = await import('firebase/auth');
            const { auth } = await import('../config/firebase');
            
            if (auth) {
              await signInWithCustomToken(auth, customToken);
              console.log("Firebase Auth Custom Sign-in Successful");
            }
          } catch (firebaseErr) {
            console.error("Firebase Custom Auth Error:", firebaseErr);
            // We set userProfile anyway so LIFF works, but Firebase writes will fail if unauthenticated
          }

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
