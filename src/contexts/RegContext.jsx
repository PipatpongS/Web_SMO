import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const RegContext = createContext();

export const useRegistration = () => useContext(RegContext);

export const RegProvider = ({ children }) => {
  const { userProfile, loading: authLoading } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [regData, setRegData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      if (authLoading || !userProfile) {
        if (!authLoading) setLoading(false);
        return;
      }

      const userId = userProfile.userId;
      
      // 1. Check LocalStorage (Fast Path)
      const cachedReg = localStorage.getItem(`reg_${userId}`);
      if (cachedReg) {
        setRegData(JSON.parse(cachedReg));
        setIsRegistered(true);
        setLoading(false);
        return;
      }

      // 2. Check Firebase if not in cache
      if (db) {
        try {
          const docRef = doc(db, "users", userId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Cache to LocalStorage
            localStorage.setItem(`reg_${userId}`, JSON.stringify(data));
            setRegData(data);
            setIsRegistered(true);
          } else {
            setIsRegistered(false);
          }
        } catch (err) {
          console.error("Error fetching registration data:", err);
          setIsRegistered(false); // Default to not registered on error
        }
      } else {
        // Fallback for dev mode without Firebase
        setIsRegistered(false);
      }
      
      setLoading(false);
    };

    checkRegistration();
  }, [userProfile, authLoading]);

  const registerUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    
    const userId = userProfile.userId;
    const registrationPayload = {
      name: data.name,
      age: parseInt(data.age, 10),
      shirtSize: data.shirtSize,
      is_morning_checked: false,
      is_afternoon_checked: false,
      is_shirt_received: false,
      createdAt: new Date().toISOString()
    };

    try {
      if (db) {
        await setDoc(doc(db, "users", userId), registrationPayload);
      }
      // Save to cache
      localStorage.setItem(`reg_${userId}`, JSON.stringify(registrationPayload));
      setRegData(registrationPayload);
      setIsRegistered(true);
      return { success: true };
    } catch (err) {
      console.error("Registration error:", err);
      return { success: false, error: "Failed to register. Please try again." };
    }
  };

  return (
    <RegContext.Provider value={{ isRegistered, regData, loading: loading || authLoading, registerUser }}>
      {children}
    </RegContext.Provider>
  );
};
