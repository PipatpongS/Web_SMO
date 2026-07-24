import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const RegContext = createContext();

export const useRegistration = () => useContext(RegContext);

export const RegProvider = ({ children }) => {
  const { userProfile, loading: authLoading } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [regData, setRegData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: SHA-256 Hash to generate 2 Letters + 2 Digits Short Code (e.g. BC39)
  const generateUniqueShortCode = async (dbInstance, baseQrCode) => {
    let attempt = 0;
    while (true) {
      const msgBuffer = new TextEncoder().encode(baseQrCode + (attempt > 0 ? `_${attempt}` : ''));
      let hashArray;
      
      if (window.crypto && window.crypto.subtle) {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        hashArray = Array.from(new Uint8Array(hashBuffer));
      } else {
        let hash = 0;
        const str = baseQrCode + (attempt > 0 ? `_${attempt}` : '');
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        hashArray = [Math.abs(hash) % 256, Math.abs(hash >> 8) % 256, Math.abs(hash >> 16) % 256, Math.abs(hash >> 24) % 256];
      }
      
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let code = '';
      code += letters[hashArray[0] % 26];
      code += letters[hashArray[1] % 26];
      code += numbers[hashArray[2] % 10];
      code += numbers[hashArray[3] % 10];

      if (!dbInstance) return code;

      const docRef = doc(dbInstance, 'used_short_codes', code);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return code;
      }
      attempt++;
    }
  };

  // Helper: Single-Use Temporary Walk-in Short Code Generator (e.g. W-AB12)
  const generateTempWalkinShortCode = async (dbInstance, baseQrCode) => {
    let attempt = 0;
    while (true) {
      const str = 'WALKIN_TEMP_' + baseQrCode + (attempt > 0 ? `_${attempt}` : '');
      let hashArray;
      if (window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        hashArray = Array.from(new Uint8Array(hashBuffer));
      } else {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0;
        }
        hashArray = [Math.abs(hash) % 256, Math.abs(hash >> 8) % 256, Math.abs(hash >> 16) % 256, Math.abs(hash >> 24) % 256];
      }

      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let code = 'W-';
      code += letters[hashArray[0] % 26];
      code += letters[hashArray[1] % 26];
      code += numbers[hashArray[2] % 10];
      code += numbers[hashArray[3] % 10];

      if (!dbInstance) return code;

      const docRef = doc(dbInstance, 'used_short_codes', code);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return code;
      }
      attempt++;
    }
  };

  useEffect(() => {
    let unsubscribe = null;

    const checkRegistration = async () => {
      if (!userProfile) {
        setIsRegistered(false);
        setRegData(null);
        if (!authLoading) setLoading(false);
        return;
      }

      const userId = userProfile.userId;

      // 1. Check LocalStorage (Fast Path)
      const cachedReg = localStorage.getItem(`reg_${userId}`);
      if (cachedReg) {
        try {
          const parsed = JSON.parse(cachedReg);
          setRegData(parsed);
          setIsRegistered(true);
        } catch (e) {
          console.error("Error parsing cached reg data", e);
        }
      }

      // 2. Fetch from Firestore
      try {
        if (db) {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsRegistered(true);

            // Auto-backfill missing qr_code or short_code for existing users
            let targetQrCode = data.qr_code;
            let targetShortCode = data.short_code;
            let needsUpdate = false;

            if (!targetQrCode) {
              const studentId = data.studentId || '';
              targetQrCode = `${userId}:${studentId}`;
              needsUpdate = true;
            }

            if (!targetShortCode) {
              targetShortCode = await generateUniqueShortCode(db, targetQrCode);
              needsUpdate = true;
            }

            if (needsUpdate) {
              const updateFields = {};
              if (!data.qr_code) {
                updateFields.qr_code = targetQrCode;
                data.qr_code = targetQrCode;
              }
              if (!data.short_code) {
                updateFields.short_code = targetShortCode;
                data.short_code = targetShortCode;
                // Reserve short_code
                try {
                  await setDoc(doc(db, "used_short_codes", targetShortCode), {
                    uid: userId,
                    timestamp: new Date().toISOString()
                  });
                } catch (scErr) {
                  console.error("Failed to write used_short_codes on backfill:", scErr);
                }
              }

              try {
                await updateDoc(docRef, updateFields);
              } catch (err) {
                console.error("Failed to backfill short_code/qr_code update:", err);
              }
            }

            setRegData(data);
            localStorage.setItem(`reg_${userId}`, JSON.stringify(data));
          } else {
            setIsRegistered(false);
            setRegData(null);
            localStorage.removeItem(`reg_${userId}`);
          }
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRegistration();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userProfile, authLoading]);

  // Registration handler for new students
  const registerUser = async (data, collectionName = "users") => {
    if (!userProfile) return { success: false, error: "Not authenticated" };

    const userId = userProfile.userId;
    const studentId = data.studentId || '';
    const qr_code = `${userId}:${studentId}`;
    const short_code = await generateUniqueShortCode(db, qr_code);
    const walkin_temp_short_code = await generateTempWalkinShortCode(db, qr_code);

    // Reserve short_code and walkin_temp_short_code in used_short_codes collection
    if (db) {
      try {
        await setDoc(doc(db, "used_short_codes", short_code), {
          uid: userId,
          timestamp: new Date().toISOString()
        });
        await setDoc(doc(db, "used_short_codes", walkin_temp_short_code), {
          uid: userId,
          type: 'walkin_temp',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to write to used_short_codes:", err);
      }
    }

    const walkinTempQr = `WALKIN_TEMP:${userId}:${walkin_temp_short_code}:${Date.now()}`;

    const registrationPayload = {
      qr_code,
      short_code,
      ...data,
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
      editCount: 0,
      note: 'รอบหน้างาน',
      walkin_status: 'PENDING_APPROVAL',
      walkin_verified: false,
      walkin_temp_qr: walkinTempQr,
      walkin_temp_short_code: walkin_temp_short_code,
      shirtSize: data.shirtSize || 'XL',
      group: null
    };

    try {
      if (db) {
        await setDoc(doc(db, collectionName, userId), registrationPayload);
      }
      localStorage.setItem(`reg_${userId}`, JSON.stringify(registrationPayload));
      setRegData(registrationPayload);
      setIsRegistered(true);

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

  // Profile update handler
  const updateUser = async (data, collectionName = "users") => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    if (!isRegistered || !regData) return { success: false, error: "No existing registration found" };

    if (regData.editCount >= 2) {
      return { success: false, error: "You have reached the maximum number of edits allowed." };
    }

    if (regData.is_verified === true) {
      let lockedFields = ['nationality', 'titlePrefix', 'firstName', 'middleName', 'lastName', 'studentIdStatus', 'studentId', 'program', 'department'];
      if (regData.studentIdStatus === 'ยังไม่ได้รับรหัสนักศึกษา' || regData.studentId === '69070500000') {
        lockedFields = lockedFields.filter(f => f !== 'studentIdStatus' && f !== 'studentId');
      }

      for (const field of lockedFields) {
        if (data[field] !== undefined && data[field] !== regData[field]) {
          return { success: false, error: "ไม่สามารถแก้ไขข้อมูลดังกล่าวได้ หากต้องการแก้ไขข้อมูลดังกล่าว โปรดติดต่อผ่านทีมงาน (LINE OA: @122ddost)" };
        }
      }
    }

    if (data.shirtSize !== undefined && data.shirtSize !== regData.shirtSize) {
      return { success: false, error: "ไม่สามารถแก้ไขไซซ์เสื้อได้ หากต้องการแก้ไข โปรดติดต่อผ่านทีมงาน (LINE OA: @122ddost)" };
    }

    const userId = userProfile.userId;
    const newEditCount = (regData.editCount || 0) + 1;

    const allowedFields = [
      'titlePrefix', 'firstName', 'middleName', 'lastName', 'email', 'phone',
      'studentIdStatus', 'studentId', 'nationality', 'program', 'department',
      'shirtSize', 'hasDietaryRestriction', 'dietaryRestriction', 'foodAllergyDetails', 'dietaryOther',
      'hasMedicalCondition', 'medicalConditionDetails', 'joinActivity',
      'role1', 'role2', 'pdpaConsent', 'staffStatus'
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
      if (db) {
        try {
          await setDoc(doc(db, "used_short_codes", short_code), {
            uid: userId,
            timestamp: new Date().toISOString()
          }, { merge: true });
        } catch (scErr) {
          console.error("Failed to write used_short_codes on update:", scErr);
        }
      }
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
        await updateDoc(doc(db, collectionName, userId), updatePayload);
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
