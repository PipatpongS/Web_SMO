import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
    let unsubscribe = null;

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
        // We do NOT return here, we proceed to set up the snapshot listener
        // to get realtime updates from Firebase.
      }

      // 2. Listen to Firebase in realtime
      if (db) {
        try {
          const docRef = doc(db, "users", userId);
          unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Update Cache
              localStorage.setItem(`reg_${userId}`, JSON.stringify(data));
              setRegData(data);
              setIsRegistered(true);
            } else {
              localStorage.removeItem(`reg_${userId}`);
              setIsRegistered(false);
            }
            setLoading(false);
          }, (err) => {
            console.error("Error fetching registration data:", err);
            if (!cachedReg) setIsRegistered(false);
            setLoading(false);
          });
        } catch (err) {
          console.error("Setup listener error:", err);
          if (!cachedReg) setIsRegistered(false);
          setLoading(false);
        }
      } else {
        // Fallback for dev mode without Firebase
        if (!cachedReg) setIsRegistered(false);
        setLoading(false);
      }
    };

    checkRegistration();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userProfile, authLoading]);

  const registerUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    
    const userId = userProfile.userId;
    const registrationPayload = {
      ...data, // Save all fields from the form dynamically
      line_uid: userId,
      line_displayName: userProfile.displayName || '',
      line_pictureUrl: userProfile.pictureUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkin_day1_morning: null,
      checkin_day1_afternoon: null,
      checkin_day2_morning: null,
      checkin_day2_afternoon: null,
      shirt_received_at: null,
      is_shirt_ordered: false,
      is_verified: false,
      editCount: 0
    };

    try {
      if (db) {
        await setDoc(doc(db, "users", userId), registrationPayload);
      }
      // Save to cache
      localStorage.setItem(`reg_${userId}`, JSON.stringify(registrationPayload));
      setRegData(registrationPayload);
      setIsRegistered(true);

      // Call API to link Rich Menu (Fire and forget, or handle silently)
      try {
        fetch('/api/link-rich-menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).catch(e => console.error("Rich menu link fetch error:", e));
      } catch (e) {
        console.error("Rich menu link error:", e);
      }

      return { success: true };
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === 'permission-denied') {
        return { success: false, errorCode: 'permission_denied' };
      }
      return { success: false, errorCode: 'register_failed', errorMsg: err.message };
    }
  };

  const updateUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    if (!isRegistered || !regData) return { success: false, error: "No existing registration found" };
    
    // Check local edit count limit just to be safe
    if (regData.editCount >= 2) {
      return { success: false, error: "You have reached the maximum number of edits allowed." };
    }

    // Check if shirt is already ordered
    if (regData.is_shirt_ordered === true) {
      return { success: false, error: "Cannot edit because your shirt has already been ordered." };
    }

    const userId = userProfile.userId;
    const newEditCount = (regData.editCount || 0) + 1;
    
    // Whitelist allowed fields to prevent Mass Assignment vulnerabilities
    const allowedFields = [
      'titlePrefix', 'firstName', 'middleName', 'lastName', 'email', 'phone', 
      'studentIdStatus', 'studentId', 'nationality', 'program', 'department', 
      'shirtSize', 'hasDietaryRestriction', 'foodAllergyDetails', 'dietaryOther', 
      'hasMedicalCondition', 'medicalConditionDetails', 'joinActivity'
    ];

    const sanitizedData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    });

    const updatePayload = {
      ...sanitizedData,
      line_displayName: userProfile.displayName || '',
      line_pictureUrl: userProfile.pictureUrl || '',
      updatedAt: new Date().toISOString(),
      editCount: newEditCount
    };

    try {
      if (db) {
        await updateDoc(doc(db, "users", userId), updatePayload);
      }
      
      const newRegData = { ...regData, ...updatePayload };
      localStorage.setItem(`reg_${userId}`, JSON.stringify(newRegData));
      setRegData(newRegData);
      
      return { success: true };
    } catch (err) {
      console.error("Update error detailed:", err);
      if (err.code === 'permission-denied') {
        return { success: false, errorCode: 'permission_denied' };
      }
      return { success: false, errorCode: 'unknown_error', errorMsg: err.message };
    }
  };

  return (
    <RegContext.Provider value={{ isRegistered, regData, loading: loading || authLoading, registerUser, updateUser }}>
      {children}
    </RegContext.Provider>
  );
};
