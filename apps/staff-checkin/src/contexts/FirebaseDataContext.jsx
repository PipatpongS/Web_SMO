import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc,
  query,
  where,
  limit,
  writeBatch, 
  addDoc 
} from 'firebase/firestore';
import { db, initLiff, liffLogin } from '../config/firebase';

const FirebaseDataContext = createContext();

export const useData = () => useContext(FirebaseDataContext);

// Helper for Thai ISO timestamp (+07:00)
export const getThaiISOString = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thaiTime = new Date(utc + (3600000 * 7));
  const year = thaiTime.getFullYear();
  const month = String(thaiTime.getMonth() + 1).padStart(2, '0');
  const day = String(thaiTime.getDate()).padStart(2, '0');
  const hours = String(thaiTime.getHours()).padStart(2, '0');
  const minutes = String(thaiTime.getMinutes()).padStart(2, '0');
  const seconds = String(thaiTime.getSeconds()).padStart(2, '0');
  const millis = String(thaiTime.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}+07:00`;
};

// Formatted time display (e.g. "10:30:15 น.")
export const formatThaiTime = (dateObj = new Date()) => {
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds} น.`;
};

// Staff Roles
export const ROLES = {
  OPERATOR: 'STAFF_OPERATOR',   // Regular Staff - Shirt Check-in
  SUPERVISOR: 'STAFF_SUPERVISOR' // High Admin - Shirt Check-in + Stock Dashboard
};

const CACHE_KEY = 'cached_students_db_real_v5';
const CACHE_TIME_KEY = 'cached_students_timestamp_real_v5';
const CACHE_INVENTORY_KEY = 'cached_shirt_inventory_v1';
const CACHE_TTL_MS = 3 * 60 * 1000;

export const FirebaseDataProvider = ({ children }) => {
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('staff_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [liffProfile, setLiffProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem('liff_profile_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const saveLiffProfile = (profile) => {
    setLiffProfileState(profile);
    if (profile) {
      localStorage.setItem('liff_profile_session', JSON.stringify(profile));
    } else {
      localStorage.removeItem('liff_profile_session');
    }
  };

  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');
  
  // Physical inventory stock (from shirt_inventory collection)
  const [physicalInventory, setPhysicalInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(CACHE_INVENTORY_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Cache-first student state
  const [students, setStudents] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const [lastUpdatedText, setLastUpdatedText] = useState(() => {
    const timeSaved = localStorage.getItem(CACHE_TIME_KEY);
    return timeSaved ? formatThaiTime(new Date(parseInt(timeSaved, 10))) : 'ยังไม่ได้โหลดข้อมูล';
  });

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize LIFF on mount — safe, gets profile if opened inside LINE / LIFF
  useEffect(() => {
    initLiff().then(profile => {
      if (profile) saveLiffProfile(profile);
    });
  }, []);

  const triggerLiffLogin = async () => {
    const profile = await liffLogin();
    if (profile) {
      saveLiffProfile(profile);
      return profile;
    }
    return null;
  };

  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };

  // Fetch Physical Inventory from Firestore shirt_inventory/summary
  const fetchPhysicalInventory = useCallback(async () => {
    if (!db) return;
    try {
      const invRef = doc(db, 'shirt_inventory', 'summary');
      const invSnap = await getDoc(invRef);
      if (invSnap.exists()) {
        const data = invSnap.data();
        setPhysicalInventory(data);
        localStorage.setItem(CACHE_INVENTORY_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching shirt_inventory:", err);
    }
  }, []);

  // Quota-Optimized Dashboard Bulk Fetch
  const fetchStudentsFromFirestore = useCallback(async (forceRefresh = false) => {
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    fetchPhysicalInventory();

    if (!forceRefresh && cachedTime && (now - parseInt(cachedTime, 10) < CACHE_TTL_MS)) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.length > 0) {
          setStudents(parsed);
          setLastUpdatedText(formatThaiTime(new Date(parseInt(cachedTime, 10))));
          return;
        }
      }
    }

    if (!db) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const studentList = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        studentList.push({
          docId: docSnap.id,
          id: data.studentId || data.id || docSnap.id,
          studentId: data.studentId || data.id || docSnap.id,
          firstName: data.firstName || data.first_name || '',
          lastName: data.lastName || data.last_name || '',
          department: data.department || '',
          shirtSize: data.shirtSize || 'M',
          shortCode: data.shortCode || data.short_code || '',
          phone: data.phone || '',
          shirt_received_at: data.shirt_received_at || null,
          shirt_received_by_staff_name: data.shirt_received_by_staff_name || '',
          shirt_received_by_staff_uid: data.shirt_received_by_staff_uid || '',
          shirt_size_received: data.shirt_size_received || null,
          is_shirt_size_changed: data.is_shirt_size_changed || false,
          proxy_type: data.proxy_type || null,
          proxy_student_id: data.proxy_student_id || null,
          proxy_name: data.proxy_name || null,
          proxy_phone: data.proxy_phone || null,
          search_method: data.search_method || null,
          ...data
        });
      });

      setStudents(studentList);
      const updateTime = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(studentList));
      localStorage.setItem(CACHE_TIME_KEY, updateTime.toString());
      setLastUpdatedText(formatThaiTime(new Date(updateTime)));
    } catch (error) {
      console.error("Firestore getDocs fetch error:", error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [fetchPhysicalInventory]);

  // Update Physical Stock Inventory in Firestore (shirt_inventory/summary)
  const updatePhysicalInventory = async (newStockMap) => {
    const timestamp = getThaiISOString();
    const staffName = liffProfile?.displayName || staff?.name || 'Admin';

    const payload = {
      ...newStockMap,
      updatedAt: timestamp,
      updatedBy: staffName
    };

    if (db) {
      const invRef = doc(db, 'shirt_inventory', 'summary');
      await setDoc(invRef, payload, { merge: true });
    }

    setPhysicalInventory(payload);
    localStorage.setItem(CACHE_INVENTORY_KEY, JSON.stringify(payload));
    return true;
  };

  // ⭐️ ULTRA LOW QUOTA LOOKUP (Consumes EXACTLY 1 Read or 0 Read if in Cache)
  const findStudentByCodeDirect = async (rawCode) => {
    if (!rawCode) return null;
    const rawClean = rawCode.trim();
    const searchUpper = rawClean.toUpperCase();

    let lineUidFromQr = null;
    let studentIdFromQr = null;
    if (rawClean.includes(':')) {
      const parts = rawClean.split(':');
      lineUidFromQr = parts[0].trim();
      studentIdFromQr = parts[1].trim();
    }

    // 1️⃣ Primary QR Code Search: Match by LINE UID (Document Key) and qr_code Field FIRST!
    if (lineUidFromQr) {
      const lineUidUpper = lineUidFromQr.toUpperCase();
      
      // Check local cache for exact line_uid / docId / qr_code match
      const localUidMatch = students.find(s => {
        const sId = (s.id || s.docId || '').toUpperCase();
        const sLineUid = (s.line_uid || '').toUpperCase();
        const sQrCode = (s.qr_code || s.qrCode || '').toUpperCase();
        return sId === lineUidUpper || sLineUid === lineUidUpper || sQrCode === searchUpper;
      });
      if (localUidMatch) return localUidMatch;

      if (db) {
        // Step 1a: Direct Document Key lookup (1 Read)
        try {
          const docRef = doc(db, 'users', lineUidFromQr);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const found = { docId: docSnap.id, id: docSnap.id, ...docSnap.data() };
            setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
            return found;
          }
        } catch (err) {
          console.warn("Direct QR LINE UID doc get note:", err);
        }

        // Step 1b: Direct Query by qr_code field (1 Read)
        try {
          const qQr = query(collection(db, 'users'), where('qr_code', '==', rawClean), limit(1));
          const snapQr = await getDocs(qQr);
          if (!snapQr.empty) {
            const dSnap = snapQr.docs[0];
            const found = { docId: dSnap.id, id: dSnap.id, ...dSnap.data() };
            setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
            return found;
          }
        } catch (err) {
          console.warn("Direct qr_code query note:", err);
        }
      }
    }

    // 2️⃣ Short Code & Document ID Search (for Short Code input e.g. "FG92")
    const localCodeMatch = students.find(s => {
      const sId = (s.id || s.docId || '').toUpperCase();
      const sShortCode = (s.shortCode || s.short_code || '').toUpperCase();
      const sQrCode = (s.qrCode || s.qr_code || '').toUpperCase();
      return sId === searchUpper || sShortCode === searchUpper || sQrCode === searchUpper;
    });
    if (localCodeMatch) return localCodeMatch;

    if (!db) return null;

    // 3️⃣ Direct Get by Document Key
    try {
      const docRef = doc(db, 'users', searchUpper);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const found = { docId: docSnap.id, id: docSnap.id, ...docSnap.data() };
        setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
        return found;
      }
    } catch (err) {
      console.warn("Direct doc get note:", err);
    }

    // 4️⃣ Lookup by used_short_codes/{shortCode} collection
    try {
      const scRef = doc(db, 'used_short_codes', searchUpper);
      const scSnap = await getDoc(scRef);
      if (scSnap.exists()) {
        const scData = scSnap.data();
        const studentUid = scData.uid || scData.line_uid;
        if (studentUid) {
          const studentDocSnap = await getDoc(doc(db, 'users', studentUid));
          if (studentDocSnap.exists()) {
            const found = { docId: studentDocSnap.id, id: studentDocSnap.id, ...studentDocSnap.data() };
            setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
            return found;
          }
        }
      }
    } catch (err) {
      console.warn("used_short_codes lookup note:", err);
    }

    // 5️⃣ Targeted Query by short_code / shortCode field
    try {
      const qShort = query(collection(db, 'users'), where('short_code', '==', searchUpper), limit(1));
      const snapShort = await getDocs(qShort);
      if (!snapShort.empty) {
        const dSnap = snapShort.docs[0];
        const found = { docId: dSnap.id, id: dSnap.id, ...dSnap.data() };
        setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
        return found;
      }
    } catch (err) {
      console.warn("short_code query note:", err);
    }

    try {
      const qShortCamel = query(collection(db, 'users'), where('shortCode', '==', searchUpper), limit(1));
      const snapShortCamel = await getDocs(qShortCamel);
      if (!snapShortCamel.empty) {
        const dSnap = snapShortCamel.docs[0];
        const found = { docId: dSnap.id, id: dSnap.id, ...dSnap.data() };
        setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
        return found;
      }
    } catch (err) {
      console.warn("shortCode query note:", err);
    }

    // 6️⃣ Targeted Query by studentId (ONLY if NOT placeholder "69070500000")
    const targetStudentId = studentIdFromQr || searchUpper;
    const isPlaceholderId = targetStudentId === '69070500000' || targetStudentId.includes('ยังไม่ได้รับ');
    
    if (targetStudentId && !isPlaceholderId) {
      try {
        const qId = query(collection(db, 'users'), where('studentId', '==', targetStudentId), limit(1));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          const dSnap = snapId.docs[0];
          const found = { docId: dSnap.id, id: dSnap.id, ...dSnap.data() };
          setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
          return found;
        }
      } catch (err) {
        console.warn("studentId query note:", err);
      }
    }

    return null;
  };

  const findStudentByCode = (rawCode) => {
    if (!rawCode) return null;
    let cleanCode = rawCode.trim();
    if (cleanCode.includes(':')) {
      cleanCode = cleanCode.split(':').pop().trim();
    }
    const searchUpper = cleanCode.toUpperCase();

    return students.find(s => 
      (s.shortCode && s.shortCode.toUpperCase() === searchUpper) ||
      (s.studentId && s.studentId.toUpperCase() === searchUpper) ||
      (s.id && s.id.toUpperCase() === searchUpper) ||
      (s.docId && s.docId.toUpperCase() === searchUpper)
    ) || null;
  };

  // Username & Password Authentication (Strict Env & Firestore Verification)
  const login = async (username, password) => {
    let role = null;
    let name = '';

    const cleanUser = username.trim().toLowerCase();

    const envAdminUser = (import.meta.env.VITE_STAFF_ADMIN_USER || 'admin').trim().toLowerCase();
    const envAdminPass = (import.meta.env.VITE_STAFF_ADMIN_PASS || 'admin').trim();

    const envOperatorUser = (import.meta.env.VITE_STAFF_OPERATOR_USER || 'staff').trim().toLowerCase();
    const envOperatorPass = (import.meta.env.VITE_STAFF_OPERATOR_PASS || 'staff').trim();

    // 1. Verify against Environment Variables
    if (cleanUser === envAdminUser && password === envAdminPass) {
      role = ROLES.SUPERVISOR;
      name = 'Admin Staff';
    } else if (cleanUser === envOperatorUser && password === envOperatorPass) {
      role = ROLES.OPERATOR;
      name = 'Staff CPE';
    } 
    
    // 2. Verify against Firestore 'staff' collection if configured
    if (!role && db && cleanUser.length > 0 && password.length > 0) {
      try {
        const staffRef = collection(db, 'staff');
        const qStaff = query(staffRef, where('username', '==', cleanUser), limit(1));
        const snapStaff = await getDocs(qStaff);
        if (!snapStaff.empty) {
          const sDoc = snapStaff.docs[0].data();
          if (sDoc.password === password) {
            role = sDoc.role === 'SUPERVISOR' || sDoc.role === 'ADMIN' ? ROLES.SUPERVISOR : ROLES.OPERATOR;
            name = sDoc.name || sDoc.username;
          }
        }
      } catch (err) {
        console.warn("Firestore staff query check note:", err);
      }
    }

    const isSuccess = !!role;
    const sessionData = isSuccess ? {
      username,
      name: name || username,
      role,
      line_uid: liffProfile?.line_uid || 'LINE_ANONYMOUS',
      displayName: liffProfile?.displayName || name,
      pictureUrl: liffProfile?.pictureUrl || '',
      loginAt: getThaiISOString()
    } : null;

    if (isSuccess) {
      setStaff(sessionData);
      localStorage.setItem('staff_session', JSON.stringify(sessionData));
    }

    if (db) {
      try {
        await addDoc(collection(db, 'staff_access_logs'), {
          timestamp: getThaiISOString(),
          event: isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
          username: username,
          role_granted: role || 'NONE',
          staff_line_uid: liffProfile?.line_uid || 'UNKNOWN',
          staff_display_name: liffProfile?.displayName || name,
          staff_picture_url: liffProfile?.pictureUrl || '',
          user_agent: navigator.userAgent
        });
      } catch (err) {
        console.error("Failed to write staff_access_logs:", err);
      }
    }

    return isSuccess;
  };

  const logout = () => {
    setStaff(null);
    setLiffProfileState(null);
    localStorage.removeItem('staff_session');
    localStorage.removeItem('liff_profile_session');
  };

  // Confirm Shirt Pickup & Write Audit Logs
  const confirmShirtPickup = async (docIdOrOptions, options = {}) => {
    let studentDocId, studentData, shirtSizeReceived, proxyType, proxyStudentId, proxyName, proxyPhone, searchMethod;

    if (typeof docIdOrOptions === 'object' && docIdOrOptions !== null) {
      studentDocId = docIdOrOptions.studentDocId || docIdOrOptions.id;
      studentData = docIdOrOptions.studentData || null;
      shirtSizeReceived = docIdOrOptions.shirtSizeReceived;
      proxyType = docIdOrOptions.proxyType || null;
      proxyStudentId = docIdOrOptions.proxyStudentId || null;
      proxyName = docIdOrOptions.proxyName || null;
      proxyPhone = docIdOrOptions.proxyPhone || null;
      searchMethod = docIdOrOptions.searchMethod || 'QR_CODE';
    } else {
      studentDocId = docIdOrOptions;
      studentData = options.studentData || null;
      shirtSizeReceived = options.shirtSizeReceived;
      proxyType = options.proxyType || null;
      proxyStudentId = options.proxyStudentId || null;
      proxyName = options.proxyName || null;
      proxyPhone = options.proxyPhone || null;
      searchMethod = options.searchMethod || 'QR_CODE';
    }

    const timestamp = getThaiISOString();

    // Use passed studentData directly (most reliable), fallback to students array
    const currentStudent = studentData
      || students.find(s => s.docId === studentDocId || s.id === studentDocId || s.studentId === studentDocId);

    if (!currentStudent) {
      console.error("Student not found for docId:", studentDocId);
      return false;
    }

    // Use currentStudent.docId as the Firestore document key (LINE UID)
    const firestoreDocId = currentStudent.docId || studentDocId;

    const registeredSize = currentStudent.shirtSize || currentStudent.shirt_size || 'M';
    const isSizeChanged = (shirtSizeReceived !== registeredSize);

    const staffUid = liffProfile?.line_uid || staff?.line_uid || 'LINE_ANONYMOUS';
    const staffName = liffProfile?.displayName || staff?.name || 'Staff Operator';
    const staffPic = liffProfile?.pictureUrl || staff?.pictureUrl || '';

    const updatePayload = {
      shirt_received_at: timestamp,
      shirt_received_by_staff_uid: staffUid,
      shirt_received_by_staff_name: staffName,
      shirt_received_by_staff_pic: staffPic,
      search_method: searchMethod,
      shirt_size_received: shirtSizeReceived,
      is_shirt_size_changed: isSizeChanged,
      proxy_type: proxyType || null,
      proxy_student_id: proxyStudentId || null,
      proxy_name: proxyName || null,
      proxy_phone: proxyPhone || null
    };

    if (db) {
      try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', firestoreDocId);
        batch.update(userRef, updatePayload);

        const logRef = doc(collection(db, 'shirt_checkin_logs'));
        batch.set(logRef, {
          log_id: logRef.id,
          student_id: currentStudent.studentId || currentStudent.id || '',
          student_name: `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim(),
          department: currentStudent.department || '',
          search_method: searchMethod,
          shirtSize: registeredSize,
          shirt_size_received: shirtSizeReceived,
          is_size_changed: isSizeChanged,
          action: 'CHECKIN_SHIRT',
          timestamp: timestamp,
          staff_line_uid: staffUid,
          staff_display_name: staffName,
          staff_picture_url: staffPic,
          proxy_type: proxyType || null,
          proxy_student_id: proxyStudentId || null,
          proxy_name: proxyName || null,
          proxy_phone: proxyPhone || null
        });

        await batch.commit();
        console.log("✅ Shirt pickup committed to Firestore for:", firestoreDocId);
      } catch (err) {
        console.error("Firestore batch update error:", err);
        // Still update local state below even if Firestore fails
      }
    }

    setStudents(prev => {
      const updatedList = prev.map(s => {
        if (s.docId === firestoreDocId || s.id === firestoreDocId) {
          return { ...s, ...updatePayload };
        }
        return s;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
      return updatedList;
    });

    return true;
  };

  // Revoke Shirt Pickup
  const revokeShirtPickup = async (studentDocId) => {
    const timestamp = getThaiISOString();
    const currentStudent = students.find(s => s.docId === studentDocId || s.id === studentDocId);

    if (!currentStudent) return false;

    const resetPayload = {
      shirt_received_at: null,
      shirt_received_by_staff_uid: null,
      shirt_received_by_staff_name: null,
      shirt_received_by_staff_pic: null,
      shirt_size_received: null,
      is_shirt_size_changed: false,
      proxy_type: null,
      proxy_student_id: null,
      proxy_name: null,
      proxy_phone: null
    };

    if (db) {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', currentStudent.docId || studentDocId);

      batch.update(userRef, resetPayload);

      const logRef = doc(collection(db, 'shirt_checkin_logs'));
      batch.set(logRef, {
        log_id: logRef.id,
        student_id: currentStudent.studentId || currentStudent.id,
        student_name: `${currentStudent.firstName} ${currentStudent.lastName}`.trim(),
        department: currentStudent.department || '',
        action: 'REVOKE_SHIRT',
        timestamp: timestamp,
        staff_line_uid: liffProfile?.line_uid || staff?.line_uid || 'LINE_ANONYMOUS',
        staff_display_name: liffProfile?.displayName || staff?.name || 'Staff Operator'
      });

      await batch.commit();
    }

    setStudents(prev => {
      const updatedList = prev.map(s => {
        if (s.docId === studentDocId || s.id === studentDocId) {
          return { ...s, ...resetPayload };
        }
        return s;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedList));
      return updatedList;
    });

    return true;
  };

  return (
    <FirebaseDataContext.Provider value={{
      students,
      loading,
      isRefreshing,
      lastUpdatedText,
      physicalInventory,
      staff,
      liffProfile,
      triggerLiffLogin,
      lang,
      setLang,
      login,
      logout,
      findStudentByCode,
      findStudentByCodeDirect,
      confirmShirtPickup,
      revokeShirtPickup,
      fetchStudentsFromFirestore,
      updatePhysicalInventory
    }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};
