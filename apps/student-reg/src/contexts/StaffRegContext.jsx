import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const StaffRegContext = createContext();

export const useStaffRegistration = () => useContext(StaffRegContext);

export const StaffRegProvider = ({ children }) => {
  const { userProfile, loading: authLoading } = useAuth();

  const getCachedState = () => {
    try {
      if (userProfile && userProfile.userId) {
        const cachedReg = localStorage.getItem(`staff_reg_${userProfile.userId}`);
        if (cachedReg) {
          return { isReg: true, data: JSON.parse(cachedReg), load: false };
        }
        // Check if we previously confirmed they are NOT registered
        const notRegistered = localStorage.getItem(`not_staff_reg_${userProfile.userId}`);
        if (notRegistered === 'true') {
          return { isReg: false, data: null, load: false };
        }
      }
    } catch (e) { }
    return { isReg: false, data: null, load: true };
  };

  const initialState = getCachedState();
  const [isRegistered, setIsRegistered] = useState(initialState.isReg);
  const [regData, setRegData] = useState(initialState.data);
  const [loading, setLoading] = useState(initialState.load);

  useEffect(() => {
    let unsubscribe = null;

    const checkRegistration = async () => {
      if (authLoading || !userProfile) {
        if (!authLoading) setLoading(false);
        return;
      }

      const userId = userProfile.userId;

      // 1. Check LocalStorage (Fast Path)
      const cachedReg = localStorage.getItem(`staff_reg_${userId}`);
      if (cachedReg) {
        setRegData(JSON.parse(cachedReg));
        setIsRegistered(true);
        setLoading(false);
        // We do NOT return here, we proceed to set up the snapshot listener
        // to get realtime updates from Firebase.
      }

      // 2. Fetch from Firebase (Single Read, No Persistent Connection to save Free Tier limits)
      if (db) {
        try {
          const docRef = doc(db, "staff_applicants", userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Sync LINE profile changes to Firebase silently
            if (userProfile && (
              data.line_displayName !== (userProfile.displayName || '') ||
              data.line_pictureUrl !== (userProfile.pictureUrl || '')
            )) {
              const newProfileData = {
                line_displayName: userProfile.displayName || '',
                line_pictureUrl: userProfile.pictureUrl || ''
              };
              updateDoc(docRef, newProfileData).catch(err => {
                console.error("Failed to sync LINE profile update:", err);
              });
              Object.assign(data, newProfileData);
            }

            // Update Cache
            localStorage.setItem(`staff_reg_${userId}`, JSON.stringify(data));
            localStorage.removeItem(`not_staff_reg_${userId}`);
            setRegData(data);
            setIsRegistered(true);
          } else {
            localStorage.removeItem(`staff_reg_${userId}`);
            localStorage.setItem(`not_staff_reg_${userId}`, 'true');
            setIsRegistered(false);
          }
          setLoading(false);
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

  
  const generateUniqueShortCode = async (db, baseQrCode) => {
    let attempt = 0;
    while (true) {
      const msgBuffer = new TextEncoder().encode(baseQrCode + (attempt > 0 ? `_${attempt}` : ''));
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let code = '';
      code += letters[hashArray[0] % 26];
      code += letters[hashArray[1] % 26];
      code += numbers[hashArray[2] % 10];
      code += numbers[hashArray[3] % 10];

      const docRef = doc(db, 'used_short_codes', code);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return code;
      }
      attempt++;
    }
  };


  const registerUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    const userId = userProfile.userId;
    const studentId = data.studentId || '';
    const qr_code = `${userId}:${studentId}`;

    try {
      const short_code = await generateUniqueShortCode(db, qr_code);
      delete data.studentIdStatus;
      delete data.shirtSize;
      delete data.program;
      
      const registrationPayload = {
        qr_code,
        qrCode: qr_code,
        short_code,
        shortCode: short_code,
        ...data,
        line_uid: userId,
        line_displayName: userProfile.displayName || '',
        line_pictureUrl: userProfile.pictureUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editCount: 0,
        note: null,
        staffStatus: 'ส่งใบสมัครเสร็จสิ้น'
      };

      if (db) {
        const batch = writeBatch(db);
        batch.set(doc(db, "staff_applicants", userId), registrationPayload);
        batch.set(doc(db, "used_short_codes", short_code), { uid: userId, timestamp: new Date().toISOString() });
        await batch.commit();
      }

      localStorage.setItem(`staff_reg_${userId}`, JSON.stringify(registrationPayload));
      localStorage.removeItem(`not_staff_reg_${userId}`);
      setRegData(registrationPayload);
      setIsRegistered(true);

      localStorage.removeItem('registerFormData');
      return { success: true };
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === 'permission-denied') {
        return { success: false, error: 'permission_denied', errorMsg: err.message };
      }
      return { success: false, error: 'register_failed', errorMsg: err.message };
    }
  };

  const updateUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    if (!isRegistered || !regData) return { success: false, error: "No existing registration found" };

    // Check local edit count limit just to be safe
    if (regData.editCount >= 2) {
      return { success: false, error: "You have reached the maximum number of edits allowed." };
    }

    const userId = userProfile.userId;
    const newEditCount = (regData.editCount || 0) + 1;

    // Whitelist allowed fields to prevent Mass Assignment vulnerabilities
    const allowedFields = [
      'titlePrefix', 'firstName', 'middleName', 'lastName', 'email', 'phone',
      'studentId', 'nationality', 'department', 'lineId',
      'hasDietaryRestriction', 'dietaryRestriction', 'foodAllergyDetails', 'dietaryOther',
      'hasMedicalCondition', 'medicalConditionDetails', 'year', 'nickname', 'pdpaConsent',
      'role1', 'role2', 'staffStatus', 'joinActivity', 'note'
    ];

    const sanitizedData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    });

    const studentId = data.studentId !== undefined ? data.studentId : (regData.studentId || '');
    const qr_code = `${userId}:${studentId}`;
    let short_code = regData.short_code;
    if (!short_code || regData.qr_code !== qr_code) {
      short_code = await generateUniqueShortCode(db, qr_code);
    }


    const updatePayload = {
      qr_code,
      short_code,
      ...sanitizedData,
      line_displayName: userProfile.displayName || '',
      line_pictureUrl: userProfile.pictureUrl || '',
      updatedAt: new Date().toISOString(),
      editCount: newEditCount
    };

    try {
      if (db) {
        if (!regData.short_code || regData.qr_code !== qr_code) {
      const batch = writeBatch(db);
      batch.update(doc(db, "staff_applicants", userId), updatePayload);
      batch.set(doc(db, "used_short_codes", short_code), { uid: userId, timestamp: new Date().toISOString() });
      await batch.commit();
    } else {
      await updateDoc(doc(db, "staff_applicants", userId), updatePayload);
    }
      }

      const newRegData = { ...regData, ...updatePayload };
      localStorage.setItem(`staff_reg_${userId}`, JSON.stringify(newRegData));
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
    <StaffRegContext.Provider value={{ isRegistered, regData, loading: loading || authLoading, registerUser, updateUser }}>
      {children}
    </StaffRegContext.Provider>
  );
};
