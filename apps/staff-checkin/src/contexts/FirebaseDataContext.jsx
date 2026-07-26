import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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

// Formatted date & time display (e.g. "26 ก.ค. เวลา 10:30:15 น.")
export const formatThaiTime = (dateObj = new Date()) => {
  if (!dateObj || isNaN(new Date(dateObj).getTime())) return 'ยังไม่ได้โหลดข้อมูล';
  const d = new Date(dateObj);
  const day = d.getDate();
  const monthsTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = monthsTH[d.getMonth()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day} ${month} เวลา ${hours}:${minutes}:${seconds} น.`;
};

// Department Aliases Map to match raw Firestore string variations
export const DEPT_ALIASES = {
  'CPE': ['CPE', 'คอมพิวเตอร์', 'COMPUTER', 'วิศวกรรมคอมพิวเตอร์'],
  'ME': ['ME', 'เครื่องกล', 'MECHANICAL', 'วิศวกรรมเครื่องกล'],
  'PE': ['PE', 'อุตสาหการ', 'การผลิต', 'INDUSTRIAL', 'วิศวกรรมอุตสาหการ'],
  'CE': ['CE', 'โยธา', 'CIVIL', 'วิศวกรรมโยธา'],
  'ENV': ['ENV', 'สิ่งแวดล้อม', 'ENVIRONMENTAL', 'วิศวกรรมสิ่งแวดล้อม'],
  'CHE': ['CHE', 'เคมี', 'CHEMICAL', 'วิศวกรรมเคมี'],
  'INC': ['INC', 'วัด', 'เครื่องมือวัด', 'INSTRUMENTATION', 'CONTROL', 'วิศวกรรมระบบควบคุมและเครื่องมือวัด'],
  'EE': ['EE', 'ไฟฟ้า', 'ELECTRICAL', 'วิศวกรรมไฟฟ้า'],
  'ENE': ['ENE', 'พลังงาน', 'ENERGY', 'MATERIALS', 'อิเล็กทรอนิกส์', 'โทรคมนาคม', 'วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม'],
  'TME': ['TME', 'แม่พิมพ์', 'TOOL', 'วิศวกรรมเครื่องมือและวัสดุ']
};

export const DEPT_TRANSLATIONS_TH = {
  "CPE": "วิศวกรรมคอมพิวเตอร์",
  "CE": "วิศวกรรมโยธา",
  "CHE": "วิศวกรรมเคมี",
  "EE": "วิศวกรรมไฟฟ้า",
  "ENE": "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม",
  "ENV": "วิศวกรรมสิ่งแวดล้อม",
  "INC": "วิศวกรรมระบบควบคุมและเครื่องมือวัด",
  "ME": "วิศวกรรมเครื่องกล",
  "PE": "วิศวกรรมอุตสาหการ",
  "TME": "วิศวกรรมเครื่องมือและวัสดุ",

  "วิศวกรรมคอมพิวเตอร์": "วิศวกรรมคอมพิวเตอร์",
  "วิศวกรรมโยธา": "วิศวกรรมโยธา",
  "วิศวกรรมเคมี": "วิศวกรรมเคมี",
  "วิศวกรรมไฟฟ้า": "วิศวกรรมไฟฟ้า",
  "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม": "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม",
  "วิศวกรรมสิ่งแวดล้อม": "วิศวกรรมสิ่งแวดล้อม",
  "วิศวกรรมระบบควบคุมและเครื่องมือวัด": "วิศวกรรมระบบควบคุมและเครื่องมือวัด",
  "วิศวกรรมเครื่องกล": "วิศวกรรมเครื่องกล",
  "วิศวกรรมอุตสาหการ": "วิศวกรรมอุตสาหการ",
  "วิศวกรรมเครื่องมือและวัสดุ": "วิศวกรรมเครื่องมือและวัสดุ"
};

export const DEPT_TRANSLATIONS_EN = {
  "CPE": "Computer Engineering",
  "CE": "Civil Engineering",
  "CHE": "Chemical Engineering",
  "EE": "Electrical Engineering",
  "ENE": "Electronics and Telecommunication Engineering",
  "ENV": "Environmental Engineering",
  "INC": "Control Systems and Instrumentation Engineering",
  "ME": "Mechanical Engineering",
  "PE": "Production Engineering",
  "TME": "Tool and Materials Engineering",

  "วิศวกรรมคอมพิวเตอร์": "Computer Engineering",
  "วิศวกรรมโยธา": "Civil Engineering",
  "วิศวกรรมเคมี": "Chemical Engineering",
  "วิศวกรรมไฟฟ้า": "Electrical Engineering",
  "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม": "Electronics and Telecommunication Engineering",
  "วิศวกรรมสิ่งแวดล้อม": "Environmental Engineering",
  "วิศวกรรมระบบควบคุมและเครื่องมือวัด": "Control Systems and Instrumentation Engineering",
  "วิศวกรรมเครื่องกล": "Mechanical Engineering",
  "วิศวกรรมอุตสาหการ": "Production Engineering",
  "วิศวกรรมเครื่องมือและวัสดุ": "Tool and Materials Engineering"
};

export const formatDepartment = (deptRaw, isTH = true) => {
  if (!deptRaw) return isTH ? 'วิศวกรรมคอมพิวเตอร์' : 'Computer Engineering';
  const deptStr = String(deptRaw).trim();
  if (isTH) {
    return DEPT_TRANSLATIONS_TH[deptStr] || deptStr;
  } else {
    return DEPT_TRANSLATIONS_EN[deptStr] || deptStr;
  }
};

export const matchDepartment = (studentDeptRaw, deptCode) => {
  if (!deptCode || deptCode === 'ALL') return true;
  if (!studentDeptRaw) return false;
  const raw = String(studentDeptRaw).trim().toUpperCase();
  const target = String(deptCode).trim().toUpperCase();
  if (raw === target) return true;
  const aliases = DEPT_ALIASES[target];
  if (aliases) {
    return aliases.some(alias => raw.includes(alias.toUpperCase()));
  }
  return raw.includes(target);
};

// Staff Roles
export const ROLES = {
  SUPERVISOR: 'STAFF_SUPERVISOR',       // High Admin - Full Access
  SHIRT_OPERATOR: 'STAFF_SHIRT_OPERATOR', // Shirt Check-in Operator
  WALKIN_OPERATOR: 'STAFF_WALKIN_OPERATOR', // Walk-in Approval & Group Assignment Operator
  CHECKIN_OPERATOR: 'STAFF_CHECKIN_OPERATOR', // Registration Attendance Check-in Operator
  OPERATOR: 'STAFF_OPERATOR'            // Legacy fallback
};

// Parse mobile device model from User-Agent (best-effort on LINE in-app browser)
export const getClientDeviceInfo = () => {
  const ua = navigator.userAgent || '';
  let deviceModel = 'Unknown Device';

  if (/iPhone/.test(ua)) {
    const match = ua.match(/iPhone\s*OS\s[\d_]+;\s*([^)]+)\)/i);
    deviceModel = match ? `iPhone (${match[1].trim()})` : 'iPhone';
  } else if (/iPad/.test(ua)) {
    deviceModel = 'iPad';
  } else if (/Android/.test(ua)) {
    const match = ua.match(/;\s*([^;]+)\s+Build\//i);
    deviceModel = match ? match[1].trim() : 'Android Device';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    deviceModel = 'Mac';
  } else if (/Windows/.test(ua)) {
    deviceModel = 'Windows PC';
  }

  return {
    user_agent: ua,
    device_model: deviceModel,
    platform: navigator.platform || '',
    language: navigator.language || ''
  };
};

// Fetch public IP for audit logs (fallback to 'unknown' if blocked/offline)
export const fetchClientIp = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return 'unknown';
    const data = await res.json();
    return data?.ip || 'unknown';
  } catch {
    return 'unknown';
  }
};

const CACHE_KEY = 'cached_students_db_real_v5';
const CACHE_TIME_KEY = 'cached_students_timestamp_real_v5';
const CACHE_INVENTORY_KEY = 'cached_shirt_inventory_v1';
const CACHE_TTL_MS = 3 * 60 * 1000;

const getCheckinOperatorEnv = () => ({
  user: (
    import.meta.env.VITE_STAFF_CHECKIN_OPERATOR_USER ||
    import.meta.env.VITE_OPERATOR_USER ||
    import.meta.env.OPERATOR_USER ||
    'reg_checkin'
  ).trim().toLowerCase(),
  pass: (
    import.meta.env.VITE_STAFF_CHECKIN_OPERATOR_PASS ||
    import.meta.env.VITE_OPERATOR_PASS ||
    import.meta.env.OPERATOR_PASS ||
    'Reg_vidva_2026!?'
  ).trim()
});

export const FirebaseDataProvider = ({ children }) => {
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('staff_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [liffProfile, setLiffProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem('liff_profile_session');
      if (saved) return JSON.parse(saved);
      const savedStaff = localStorage.getItem('staff_session');
      if (savedStaff) {
        const parsedStaff = JSON.parse(savedStaff);
        if (parsedStaff && parsedStaff.line_uid) {
          return {
            line_uid: parsedStaff.line_uid,
            userId: parsedStaff.line_uid,
            displayName: parsedStaff.displayName || parsedStaff.name || 'Staff',
            pictureUrl: parsedStaff.pictureUrl || ''
          };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const saveLiffProfile = (profile) => {
    setLiffProfileState(profile);
    if (profile) {
      localStorage.setItem('liff_profile_session', JSON.stringify(profile));
      setStaff(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          line_uid: profile.userId || profile.line_uid || prev.line_uid,
          displayName: profile.displayName || prev.displayName,
          pictureUrl: profile.pictureUrl || prev.pictureUrl
        };
        localStorage.setItem('staff_session', JSON.stringify(updated));
        return updated;
      });
    } else {
      localStorage.removeItem('liff_profile_session');
    }
  };

  // Helper: Get best available Staff LINE Name, Avatar, UID, and Username for audit logs & Firestore checkin records
  const getStaffInfo = useCallback(() => {
    const lineUid = liffProfile?.userId || liffProfile?.line_uid || staff?.line_uid || 'LINE_ANONYMOUS';
    
    let staffName = 'Staff Operator';
    if (liffProfile?.displayName && !liffProfile.displayName.startsWith('สตาฟ ')) {
      staffName = liffProfile.displayName;
    } else if (staff?.displayName && !staff.displayName.startsWith('สตาฟ ')) {
      staffName = staff.displayName;
    } else if (liffProfile?.displayName) {
      staffName = liffProfile.displayName;
    } else if (staff?.name || staff?.displayName || staff?.username) {
      staffName = staff.name || staff.displayName || staff.username;
    }

    const staffPic = liffProfile?.pictureUrl || staff?.pictureUrl || '';
    const staffUsername = staff?.username || '';

    return { staffUid: lineUid, staffName, staffPic, staffUsername };
  }, [liffProfile, staff]);

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
  const [liffLoading, setLiffLoading] = useState(true);

  // Initialize LIFF on mount — safe, gets profile if opened inside LINE / LIFF
  useEffect(() => {
    initLiff().then(profile => {
      if (profile) saveLiffProfile(profile);
    }).catch(err => {
      console.warn("LIFF initialization note:", err);
    }).finally(() => {
      setLiffLoading(false);
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
          shirtSize: data.shirtSize || 'M',
          ...data,
          docId: docSnap.id,
          line_uid: data.line_uid || docSnap.id,
          id: data.studentId || data.id || docSnap.id,
          studentId: data.studentId || data.id || docSnap.id,
          firstName: data.firstName || data.first_name || '',
          lastName: data.lastName || data.last_name || '',
          department: data.department || '',
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
          checkin_day1_morning: data.checkin_day1_morning || null,
          checkin_day1_morning_by: data.checkin_day1_morning_by || data.checkin_day1_morning_by_staff_name || '',
          checkin_day1_morning_by_staff_uid: data.checkin_day1_morning_by_staff_uid || '',
          checkin_day1_morning_by_staff_pic: data.checkin_day1_morning_by_staff_pic || '',
          checkin_day2_morning: data.checkin_day2_morning || null,
          checkin_day2_morning_by: data.checkin_day2_morning_by || data.checkin_day2_morning_by_staff_name || '',
          checkin_day2_morning_by_staff_uid: data.checkin_day2_morning_by_staff_uid || '',
          checkin_day2_morning_by_staff_pic: data.checkin_day2_morning_by_staff_pic || ''
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

  // ⭐️ REALTIME FIRESTORE LOOKUP (Fetches fresh data directly from Firestore)
  const findStudentByCodeDirect = async (rawCode, options = {}) => {
    if (!rawCode) return null;
    const rawClean = rawCode.trim();
    const forceFresh = options.forceFresh === true || options.bypassCache === true;

    let lineUidFromQr = null;
    let studentIdFromQr = null;
    let tempShortCode = null;
    let cleanCode = rawClean;

    if (rawClean.startsWith('WALKIN_TEMP:')) {
      const parts = rawClean.split(':');
      if (parts.length >= 3) {
        lineUidFromQr = parts[1].trim();
        tempShortCode = parts[2].trim();
        cleanCode = parts[2].trim();
      }
    } else if (rawClean.includes(':')) {
      const parts = rawClean.split(':');
      lineUidFromQr = parts[0].trim();
      studentIdFromQr = parts[1].trim();
    } else if (rawClean.startsWith('U') && rawClean.length >= 25 && !rawClean.includes('-')) {
      lineUidFromQr = rawClean;
    }

    const searchUpper = cleanCode.toUpperCase();
    const tempShortUpper = tempShortCode ? tempShortCode.toUpperCase() : searchUpper;

    const shortCodeCandidates = new Set([searchUpper]);
    if (/^[A-Z0-9]{4}$/.test(searchUpper)) {
      shortCodeCandidates.add(`W-${searchUpper}`);
    }
    if (searchUpper.startsWith('W-') && /^[A-Z0-9]{4}$/.test(searchUpper.slice(2))) {
      shortCodeCandidates.add(searchUpper.slice(2));
    } else if (searchUpper.startsWith('W') && /^[A-Z0-9]{4}$/.test(searchUpper.slice(1))) {
      shortCodeCandidates.add(`W-${searchUpper.slice(1)}`);
      shortCodeCandidates.add(searchUpper.slice(1));
    }

    // 1️⃣ Step 1: Check Local Cache ONLY if not forcing fresh data
    if (!forceFresh) {
      if (lineUidFromQr) {
        const targetUidLower = lineUidFromQr.toLowerCase();
        const localUidMatch = students.find(s => {
          const sDocIdLower = (s.docId || '').toLowerCase();
          const sLineUidLower = (s.line_uid || '').toLowerCase();
          const sIdLower = (s.id || '').toLowerCase();
          return sDocIdLower === targetUidLower || sLineUidLower === targetUidLower || sIdLower === targetUidLower;
        });
        if (localUidMatch) return localUidMatch;
      } else {
        const localMatch = students.find(s => {
          const sShortCode = (s.shortCode || s.short_code || s.walkin_temp_short_code || '').toUpperCase();
          const sQrCode = (s.qrCode || s.qr_code || '').toUpperCase();
          const sStudentId = String(s.studentId || s.id || s.student_id || '').trim().toUpperCase();
          const isPlaceholder = sStudentId === '69070500000';

          if (tempShortUpper && sShortCode === tempShortUpper) return true;
          if (searchUpper && (shortCodeCandidates.has(sShortCode) || sQrCode === searchUpper || (!isPlaceholder && sStudentId === searchUpper))) return true;
          return false;
        });
        if (localMatch) return localMatch;
      }
    }

    if (!db) return null;

    // 2️⃣ Step 2: Direct Document Key Lookup by LINE UID (Tries original case & lowercase)
    if (lineUidFromQr) {
      try {
        const uidsToTry = Array.from(new Set([lineUidFromQr, lineUidFromQr.toLowerCase()].filter(Boolean)));
        for (const uid of uidsToTry) {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const found = { ...docSnap.data(), docId: docSnap.id, line_uid: docSnap.id };
            setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
            return found; // Return exact user doc immediately!
          }
        }
      } catch (err) {
        console.warn("Direct QR LINE UID doc get note:", err);
      }
    }

    // 3️⃣ Step 3: Direct Get by Document Key matching cleanCode (Tries original case, lowercase, and upper)
    try {
      const keysToTry = Array.from(new Set([cleanCode, cleanCode.toLowerCase(), searchUpper].filter(Boolean)));
      for (const k of keysToTry) {
        const docRef = doc(db, 'users', k);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const found = { ...docSnap.data(), docId: docSnap.id, line_uid: docSnap.id };
          setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
          return found; // Return immediately — 1 Read consumed total!
        }
      }
    } catch (err) {
      console.warn("Direct doc get note:", err);
    }

    // 4️⃣ Step 4: Lookup by used_short_codes/{shortCode} Document Key (1-2 Reads)
    try {
      const targetShortCodes = Array.from(new Set([tempShortUpper, searchUpper, ...shortCodeCandidates].filter(Boolean)));
      for (const codeStr of targetShortCodes) {
        const scRef = doc(db, 'used_short_codes', codeStr);
        const scSnap = await getDoc(scRef);
        if (scSnap.exists()) {
          const scData = scSnap.data();
          const studentUid = scData.uid || scData.line_uid;
          if (studentUid) {
            const studentDocSnap = await getDoc(doc(db, 'users', studentUid));
            if (studentDocSnap.exists()) {
              const found = { ...studentDocSnap.data(), docId: studentDocSnap.id, line_uid: studentDocSnap.id };
              setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
              return found; // Return immediately!
            }
          }
        }
      }
    } catch (err) {
      console.warn("used_short_codes lookup note:", err);
    }

    // 5️⃣ Step 5: Targeted Query by short_code / walkin_temp_short_code field with limit(1)
    const targetCodesToQuery = Array.from(new Set([searchUpper, tempShortUpper, ...shortCodeCandidates].filter(Boolean)));
    for (const codeStr of targetCodesToQuery) {
      try {
        const qShort = query(collection(db, 'users'), where('short_code', '==', codeStr), limit(1));
        const snapShort = await getDocs(qShort);
        if (!snapShort.empty) {
          const dSnap = snapShort.docs[0];
          const found = { ...dSnap.data(), docId: dSnap.id, line_uid: dSnap.id };
          setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
          return found; // Return immediately!
        }
      } catch (err) {
        console.warn("short_code query note:", err);
      }

      try {
        const qWalkinTemp = query(collection(db, 'users'), where('walkin_temp_short_code', '==', codeStr), limit(1));
        const snapWalkinTemp = await getDocs(qWalkinTemp);
        if (!snapWalkinTemp.empty) {
          const dSnap = snapWalkinTemp.docs[0];
          const found = { ...dSnap.data(), docId: dSnap.id, line_uid: dSnap.id };
          setStudents(prev => [...prev.filter(x => x.docId !== found.docId), found]);
          return found; // Return immediately!
        }
      } catch (err) {
        console.warn("walkin_temp_short_code query note:", err);
      }
    }

    // 6️⃣ Step 6: Targeted Query by studentId (ONLY if NOT placeholder "69070500000")
    const targetStudentId = studentIdFromQr || searchUpper;
    const isPlaceholderId = targetStudentId === '69070500000' || targetStudentId.includes('ยังไม่ได้รับ');

    if (targetStudentId && !isPlaceholderId) {
      try {
        const qId = query(collection(db, 'users'), where('studentId', '==', targetStudentId), limit(1));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          const dSnap = snapId.docs[0];
          const found = { ...dSnap.data(), docId: dSnap.id, line_uid: dSnap.id };
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
    if (cleanCode.startsWith('WALKIN_TEMP:')) {
      const parts = cleanCode.split(':');
      if (parts.length >= 3) {
        cleanCode = parts[2];
      }
    } else if (cleanCode.includes(':')) {
      cleanCode = cleanCode.split(':').pop().trim();
    }
    const searchUpper = cleanCode.toUpperCase();

    return students.find(s =>
      (s.shortCode && s.shortCode.toUpperCase() === searchUpper) ||
      (s.short_code && s.short_code.toUpperCase() === searchUpper) ||
      (s.walkin_temp_short_code && s.walkin_temp_short_code.toUpperCase() === searchUpper) ||
      (s.walkin_temp_qr && s.walkin_temp_qr.toUpperCase().includes(searchUpper)) ||
      (s.studentId && s.studentId.toUpperCase() === searchUpper) ||
      (s.id && s.id.toUpperCase() === searchUpper) ||
      (s.docId && s.docId.toUpperCase() === searchUpper)
    ) || null;
  };

  // Username & Password Authentication (Strict Env & Firestore Verification)
  const login = async (username, password) => {
    if (!username || !password) return { success: false, reason: 'MISSING_FIELDS' };

    let role = null;
    let name = '';
    let department = null;

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const cleanVal = (val, fallback = '') => {
      const raw = val || fallback;
      return String(raw).split('#')[0].trim();
    };

    const envAdminUser = cleanVal(import.meta.env.VITE_STAFF_ADMIN_USER, 'rak_smo').toLowerCase();
    const envAdminPass = cleanVal(import.meta.env.VITE_STAFF_ADMIN_PASS, 'Rak_vidva_!?');

    const envShirtOperatorUser = cleanVal(import.meta.env.VITE_STAFF_OPERATOR_USER, 'shirt_check').toLowerCase();
    const envShirtOperatorPass = cleanVal(import.meta.env.VITE_STAFF_OPERATOR_PASS, 'HB{lVtEE9jU');

    const envWalkinOperatorUser = cleanVal(import.meta.env.VITE_STAFF_WALKIN_OPERATOR_USER, 'walkin_approve').toLowerCase();
    const envWalkinOperatorPass = cleanVal(import.meta.env.VITE_STAFF_WALKIN_OPERATOR_PASS, 'HzA[HH1q~2');

    const { user: rawOperatorUser, pass: rawOperatorPass } = getCheckinOperatorEnv();
    const envCheckinOperatorUser = cleanVal(rawOperatorUser, 'reg_checkin').toLowerCase();
    const envCheckinOperatorPass = cleanVal(rawOperatorPass, 'Reg_vidva_2026!?');

    const DEPT_ACCOUNTS = [
      { dept: 'CPE', name: 'สตาฟ CPE (คอมพิวเตอร์)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_CPE_USER, 'cpe_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_CPE_PASS, 'IHJvT(jot^F') },
      { dept: 'ME', name: 'สตาฟ ME (เครื่องกล)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_ME_USER, 'me_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_ME_PASS, 'eu]III}@5z}') },
      { dept: 'PE', name: 'สตาฟ PE (อุตสาหการ)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_PE_USER, 'pe_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_PE_PASS, ')crZbUg{1-E') },
      { dept: 'CE', name: 'สตาฟ CE (โยธา)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_CE_USER, 'ce_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_CE_PASS, ']0nai=%NOOX') },
      { dept: 'ENV', name: 'สตาฟ ENV (สิ่งแวดล้อม)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_ENV_USER, 'env_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_ENV_PASS, 'WITqRd%Qg~U') },
      { dept: 'CHE', name: 'สตาฟ CHE (เคมี)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_CHE_USER, 'che_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_CHE_PASS, ')2gaev3Csp~') },
      { dept: 'INC', name: 'สตาฟ INC (เครื่องมือวัด)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_INC_USER, 'inc_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_INC_PASS, 'DNf^KyhT%&q') },
      { dept: 'EE', name: 'สตาฟ EE (ไฟฟ้า)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_EE_USER, 'ee_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_EE_PASS, ')~P^qr([sX9') },
      { dept: 'ENE', name: 'สตาฟ ENE (พลังงาน)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_ENE_USER, 'ene_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_ENE_PASS, 'Qdp[{kSJ8L^') },
      { dept: 'TME', name: 'สตาฟ TME (แม่พิมพ์)', u: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_TME_USER, 'tme_checkin').toLowerCase(), p: cleanVal(import.meta.env.VITE_STAFF_CHECKIN_DAY2_TME_PASS, 'y4^BkxhH19M') },
    ];

    // 1. Verify against Environment Variables
    if (cleanUser === envAdminUser && (cleanPass === envAdminPass || password === envAdminPass)) {
      role = ROLES.SUPERVISOR;
      name = 'Admin Staff (SMO)';
    } else if (cleanUser === envShirtOperatorUser && (cleanPass === envShirtOperatorPass || password === envShirtOperatorPass)) {
      role = ROLES.SHIRT_OPERATOR;
      name = 'Shirt Check Operator';
    } else if (cleanUser === envWalkinOperatorUser && (cleanPass === envWalkinOperatorPass || password === envWalkinOperatorPass)) {
      role = ROLES.WALKIN_OPERATOR;
      name = 'Walk-in Approval Operator';
    } else if (cleanUser === envCheckinOperatorUser && (cleanPass === envCheckinOperatorPass || password === envCheckinOperatorPass)) {
      role = ROLES.CHECKIN_OPERATOR;
      name = 'Registration Check-in Operator';
    } else {
      const matchDept = DEPT_ACCOUNTS.find(acc => acc.u === cleanUser && (acc.p === cleanPass || acc.p === password));
      if (matchDept) {
        role = ROLES.CHECKIN_OPERATOR;
        name = matchDept.name;
        department = matchDept.dept;
      }
    }

    // 2. Verify against Firestore 'staff' collection if configured
    if (!role && db && cleanUser.length > 0 && cleanPass.length > 0) {
      try {
        const staffRef = collection(db, 'staff');
        const qStaff = query(staffRef, where('username', '==', cleanUser), limit(1));
        const snapStaff = await getDocs(qStaff);
        if (!snapStaff.empty) {
          const sDoc = snapStaff.docs[0].data();
          if (sDoc.password === cleanPass || sDoc.password === password) {
            role = sDoc.role === 'SUPERVISOR' || sDoc.role === 'ADMIN' ? ROLES.SUPERVISOR : (sDoc.role || ROLES.OPERATOR);
            name = sDoc.name || sDoc.username;
            department = sDoc.department || null;
          }
        }
      } catch (err) {
        console.warn("Firestore staff query check note:", err);
      }
    }

    const isSuccess = !!role;
    const effectiveLiffProfile = liffProfile || {
      line_uid: `WEB_${cleanUser}`,
      displayName: name || cleanUser,
      pictureUrl: ''
    };

    if (isSuccess && !liffProfile) {
      saveLiffProfile(effectiveLiffProfile);
    }

    const sessionData = isSuccess ? {
      username,
      name: name || username,
      role,
      department: department || null,
      line_uid: effectiveLiffProfile.line_uid,
      displayName: effectiveLiffProfile.displayName || name,
      pictureUrl: effectiveLiffProfile.pictureUrl || '',
      loginAt: getThaiISOString()
    } : null;

    if (isSuccess) {
      setStaff(sessionData);
      localStorage.setItem('staff_session', JSON.stringify(sessionData));
    }

    // 3. Write Audit Log to Firestore
    if (db) {
      try {
        await addDoc(collection(db, 'staff_access_logs'), {
          timestamp: getThaiISOString(),
          event: isSuccess ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
          username: username,
          role_granted: role || 'NONE',
          department: department || 'NONE',
          staff_line_uid: liffProfile.line_uid,
          staff_display_name: liffProfile.displayName || name,
          staff_picture_url: liffProfile.pictureUrl || '',
          user_agent: navigator.userAgent
        });
      } catch (err) {
        console.error("Failed to write staff_access_logs:", err);
      }
    }

    return {
      success: isSuccess,
      reason: isSuccess ? null : 'INVALID_CREDENTIALS'
    };
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

    const { staffUid, staffName, staffPic } = getStaffInfo();

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
        return { success: false, error: err?.message || String(err) };
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

    return { success: true };
  };

  // Revoke Shirt Pickup & Write Audit Logs
  const revokeShirtPickup = async (studentDocId) => {
    const timestamp = getThaiISOString();
    const currentStudent = students.find(s => s.docId === studentDocId || s.id === studentDocId);

    if (!currentStudent) return { success: false, error: 'Student record not found' };

    const resetPayload = {
      shirt_received_at: null,
      shirt_received_by_staff_uid: null,
      shirt_received_by_staff_name: null,
      shirt_received_by_staff_pic: null,
      search_method: null,
      shirt_size_received: null,
      is_shirt_size_changed: false,
      proxy_type: null,
      proxy_student_id: null,
      proxy_name: null,
      proxy_phone: null
    };

    try {
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

      return { success: true };
    } catch (err) {
      console.error("Failed to revoke shirt pickup:", err);
      return { success: false, error: err?.message || String(err) };
    }
  };

  // Approve Walk-in Registration On-site by Staff & Instant Group Assignment
  // Accepts either a full student object OR a docId string (backward compatible)
  const approveWalkinRegistration = async (studentOrDocId) => {
    if (!studentOrDocId) return { success: false, error: 'Missing student document ID' };

    // Accept full student object or fallback to lookup by ID
    let targetStudent = null;
    if (typeof studentOrDocId === 'object' && studentOrDocId !== null) {
      targetStudent = studentOrDocId;
    } else {
      const studentDocId = studentOrDocId;
      targetStudent = students.find(s =>
        s.docId === studentDocId ||
        s.id === studentDocId ||
        s.line_uid === studentDocId ||
        s.studentId === studentDocId ||
        (s.short_code && s.short_code.toUpperCase() === String(studentDocId).toUpperCase()) ||
        (s.walkin_temp_short_code && s.walkin_temp_short_code.toUpperCase() === String(studentDocId).toUpperCase())
      );
    }

    if (!targetStudent) return { success: false, error: 'Student record not found' };

    // Department Restriction Check for Walk-in Approval:
    // Supervisor (rak_smo) and Walk-in Operator (walkin_approve) can approve EVERYONE regardless of department!
    // Department Staff (cpe_checkin, me_checkin, etc.) can ONLY approve students in their own department!
    const isSupervisor = staff?.role === ROLES.SUPERVISOR;
    const isWalkinOperator = staff?.role === ROLES.WALKIN_OPERATOR;
    if (!isSupervisor && !isWalkinOperator && staff?.department) {
      const studentDept = targetStudent.department || '';
      if (!matchDepartment(studentDept, staff.department)) {
        return {
          success: false,
          error: `คุณมีสิทธิ์อนุมัติเฉพาะนักศึกษาภาควิชาของคุณ (${formatDepartment(staff.department, true)}) นักศึกษารายนี้สังกัดภาควิชา ${formatDepartment(studentDept, true)} (Walk-in approval is limited to your department)`
        };
      }
    }

    // Real Firestore Document Key: prefer line_uid field (stored in Firestore doc) > docId > id
    const firestoreDocId = targetStudent.line_uid || targetStudent.docId || studentOrDocId;
    console.log('✅ approveWalkinRegistration → firestoreDocId:', firestoreDocId, '| targetStudent.line_uid:', targetStudent.line_uid, '| targetStudent.docId:', targetStudent.docId);

    const { staffUid, staffName, staffPic, staffUsername } = getStaffInfo();
    const approvedAt = getThaiISOString();

    // 1. Determine nationality (Foreigners strictly ONLY in Group 1: DREAM or Group 2: DESIGN)
    const isForeigner = (targetStudent.is_foreigner === true || targetStudent.isForeigner === true) ||
      (targetStudent.nationality &&
        targetStudent.nationality.trim() !== 'ไทย' &&
        targetStudent.nationality.trim().toLowerCase() !== 'thai');

    const GROUP_NAMES_MAP = {
      '1': 'DREAM',
      '2': 'DESIGN',
      '3': 'BUILD',
      '4': 'BLOOM',
      '5': 'BEYOND'
    };

    const REVERSE_GROUP_MAP = {
      'DREAM': '1',
      'DESIGN': '2',
      'BUILD': '3',
      'BLOOM': '4',
      'BEYOND': '5'
    };

    // 2. Count current group sizes across all students
    const groupCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    students.forEach(s => {
      if (s.group) {
        const str = String(s.group).trim().toUpperCase();
        const numKey = REVERSE_GROUP_MAP[str] || str;
        if (groupCounts.hasOwnProperty(numKey)) {
          groupCounts[numKey]++;
        }
      }
    });

    let candidateGroups = [];
    if (isForeigner) {
      // Foreigners ONLY in Group 1 (DREAM) or Group 2 (DESIGN)
      const minCount = Math.min(groupCounts['1'], groupCounts['2']);
      if (groupCounts['1'] === minCount) candidateGroups.push('1');
      if (groupCounts['2'] === minCount) candidateGroups.push('2');
    } else {
      // Thais in Groups 1-5 (Min count balancing with random tie-breaker)
      const minCount = Math.min(...Object.values(groupCounts));
      candidateGroups = Object.keys(groupCounts).filter(g => groupCounts[g] === minCount);
    }

    // Tie-breaker: Equal-probability random choice among candidate minimum groups
    const assignedGroup = candidateGroups[Math.floor(Math.random() * candidateGroups.length)];
    const assignedGroupName = GROUP_NAMES_MAP[assignedGroup] || assignedGroup;

    const updateFields = {
      walkin_status: 'APPROVED',
      walkin_verified: true,
      group: assignedGroupName,
      Group: assignedGroupName,
      status: 'APPROVED',
      walkin_approved_at: approvedAt,
      walkin_approved_by_staff_name: staffName,
      walkin_approved_by_staff_uid: staffUid,
      updatedAt: approvedAt
    };

    try {
      if (db) {
        const studentRef = doc(db, 'users', firestoreDocId);
        await updateDoc(studentRef, updateFields);
        console.log("✅ Walk-in registration approved in Firestore for docId:", firestoreDocId);

        try {
          await addDoc(collection(db, 'staff_access_logs'), {
            timestamp: approvedAt,
            event: 'WALKIN_APPROVED_AND_ASSIGNED_GROUP',
            student_doc_id: firestoreDocId,
            student_line_uid: targetStudent.line_uid || targetStudent.docId || '',
            student_id: targetStudent.studentId || '',
            student_short_code: targetStudent.short_code || targetStudent.walkin_temp_short_code || targetStudent.shortCode || '',
            student_name: `${targetStudent.firstName || ''} ${targetStudent.lastName || ''}`.trim(),
            student_group: targetStudent.group || targetStudent.assigned_group || targetStudent.assigned_group_name || '',
            assigned_group: assignedGroup,
            assigned_group_name: assignedGroupName,
            is_foreigner: isForeigner,
            staff_line_uid: staffUid,
            staff_username: staffUsername,
            staff_display_name: staffName,
            staff_role: staff?.role || '',
            user_agent: navigator.userAgent
          });
        } catch (e) {
          console.warn("Audit log note:", e);
        }
      }

      setStudents(prev => {
        const updated = prev.map(s => {
          if (s.docId === firestoreDocId || s.line_uid === firestoreDocId) {
            return { ...s, ...updateFields };
          }
          return s;
        });
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      return {
        success: true,
        assignedGroup,
        assignedGroupName
      };
    } catch (err) {
      console.error("Failed to approve walk-in registration in Firestore:", err);
      const errMsg = err?.message || String(err);
      // Common errors and user-friendly messages
      if (errMsg.includes('permission') || errMsg.includes('PERMISSION_DENIED')) {
        return { success: false, error: `ไม่มีสิทธิ์แก้ไขข้อมูล (Permission Denied). กรุณาเข้าสู่ระบบใหม่` };
      }
      if (errMsg.includes('not-found') || errMsg.includes('NOT_FOUND')) {
        return { success: false, error: `ไม่พบเอกสารใน Firebase (Doc ID: ${firestoreDocId}). กรุณา Refresh และลองใหม่` };
      }
      return { success: false, error: `Firebase Error: ${errMsg}` };
    }
  };

  // Confirm Registration Check-in — supports optional `day` param (1 or 2) for Admin override
  const confirmRegistrationCheckin = async (docIdOrOptions, options = {}) => {
    let studentDocId, studentData, searchMethod, dayOverride;

    if (typeof docIdOrOptions === 'object' && docIdOrOptions !== null) {
      studentDocId = docIdOrOptions.studentDocId || docIdOrOptions.id;
      studentData = docIdOrOptions.studentData || null;
      searchMethod = docIdOrOptions.searchMethod || 'QR_CODE';
      dayOverride = docIdOrOptions.day || null; // explicit day (1 or 2) from Admin
    } else {
      studentDocId = docIdOrOptions;
      studentData = options.studentData || null;
      searchMethod = options.searchMethod || 'QR_CODE';
      dayOverride = options.day || null;
    }

    const timestamp = getThaiISOString();
    let currentStudent = studentData
      || students.find(s => s.docId === studentDocId || s.id === studentDocId || s.studentId === studentDocId);

    // ⭐️ REALTIME FIRESTORE RE-VERIFICATION: Fetch fresh student doc directly from Firestore to bypass any stale local device cache
    const targetDocId = currentStudent?.line_uid || currentStudent?.docId || studentDocId;
    if (db && targetDocId) {
      try {
        const freshSnap = await getDoc(doc(db, 'users', targetDocId));
        if (freshSnap.exists()) {
          const freshData = { ...freshSnap.data(), docId: freshSnap.id, line_uid: freshSnap.id };
          currentStudent = freshData;
          setStudents(prev => [...prev.filter(x => x.docId !== freshData.docId), freshData]);
        }
      } catch (err) {
        console.warn("Realtime Firestore re-verification note:", err);
      }
    }

    if (!currentStudent) {
      return { success: false, error: 'ไม่พบข้อมูลนักศึกษาในระบบ' };
    }

    // Walk-in approval check: Only enforce for actual Walk-in students (registered on-site). Normal pre-registered students bypass this check!
    const isWalkinStudent = currentStudent.note === 'รอบหน้างาน' ||
                            currentStudent.walkin_status === 'PENDING_APPROVAL' ||
                            (currentStudent.short_code && String(currentStudent.short_code).toUpperCase().startsWith('W-')) ||
                            (currentStudent.walkin_temp_short_code && String(currentStudent.walkin_temp_short_code).length > 0);

    if (isWalkinStudent) {
      const isApproved = currentStudent.walkin_status === 'APPROVED' || currentStudent.walkin_verified === true || currentStudent.status === 'APPROVED';
      if (!isApproved) {
        return {
          success: false,
          error: 'นักศึกษารอบหน้างาน (Walk-in) ยังไม่ได้รับการอนุมัติ กรุณาให้อนุมัติการลงทะเบียน Walk-in ก่อนเช็คชื่อ'
        };
      }
    }

    // Department Restriction: Check if student belongs to logged-in staff's department
    const isSupervisor = staff?.role === ROLES.SUPERVISOR;
    if (!isSupervisor && staff?.department) {
      const studentDept = currentStudent.department || '';
      if (!matchDepartment(studentDept, staff.department)) {
        return {
          success: false,
          error: `นักศึกษาไม่ได้อยู่ในภาควิชาของคุณ (${studentDept || 'ไม่ระบุ'} / สตาฟ: ${staff.department}) (Student is not in your department)`
        };
      }
    }

    const { user: envCheckinOperatorUser } = getCheckinOperatorEnv();
    const staffUsername = (staff?.username || '').toLowerCase();
    const isSupervisorAccount = staff?.role === ROLES.SUPERVISOR;

    // Determine effective day:
    // 1) Admin with explicit dayOverride param wins
    // 2) day_1_checkin account → Day 1
    // 3) All others → Day 2
    let effectiveDay;
    if (isSupervisorAccount && (dayOverride === 1 || dayOverride === '1')) {
      effectiveDay = 1;
    } else if (isSupervisorAccount && (dayOverride === 2 || dayOverride === '2')) {
      effectiveDay = 2;
    } else {
      const isDay1CheckinAccount =
        staffUsername === 'day_1_checkin' ||
        (envCheckinOperatorUser.toLowerCase() === 'day_1_checkin' && staff?.role === ROLES.CHECKIN_OPERATOR && !staff?.department);
      effectiveDay = isDay1CheckinAccount ? 1 : 2;
    }
    const isDay1 = effectiveDay === 1;

    if (isDay1) {
      if (currentStudent.checkin_day1_morning) {
        const byText = currentStudent.checkin_day1_morning_by ? ` โดย ${currentStudent.checkin_day1_morning_by}` : '';
        return {
          success: false,
          alreadyCheckedIn: true,
          error: `เช็คชื่อ Day 1 แล้วเมื่อ ${currentStudent.checkin_day1_morning}${byText}`
        };
      }
    } else {
      if (currentStudent.checkin_day2_morning) {
        const byText = currentStudent.checkin_day2_morning_by ? ` โดย ${currentStudent.checkin_day2_morning_by}` : '';
        return {
          success: false,
          alreadyCheckedIn: true,
          error: `เช็คชื่อ Day 2 แล้วเมื่อ ${currentStudent.checkin_day2_morning}${byText}`
        };
      }
    }

    const firestoreDocId = currentStudent.docId || studentDocId;
    const { staffUid, staffName, staffPic } = getStaffInfo();
    const rawStaffUsername = staff?.username || '';

    const deviceInfo = getClientDeviceInfo();
    const clientIp = await fetchClientIp();

    const updatePayload = isDay1 ? {
      checkin_day1_morning: timestamp,
      checkin_day1_morning_by: staffName,
      checkin_day1_morning_by_staff_uid: staffUid,
      checkin_day1_morning_by_staff_pic: staffPic,
      checkin_day1_morning_by_staff_username: rawStaffUsername,
      checkin_day1_morning_operator_user: rawStaffUsername || envCheckinOperatorUser,
      checkin_day1_morning_search_method: searchMethod,
      checkin_day1_morning_ip: clientIp,
      checkin_day1_morning_device_model: deviceInfo.device_model,
      checkin_day1_morning_user_agent: deviceInfo.user_agent,
      checkin_day1_morning_platform: deviceInfo.platform,
      updatedAt: timestamp
    } : {
      checkin_day2_morning: timestamp,
      checkin_day2_morning_by: staffName,
      checkin_day2_morning_by_staff_uid: staffUid,
      checkin_day2_morning_by_staff_pic: staffPic,
      checkin_day2_morning_by_staff_username: rawStaffUsername,
      checkin_day2_morning_operator_user: rawStaffUsername || envCheckinOperatorUser,
      checkin_day2_morning_search_method: searchMethod,
      checkin_day2_morning_ip: clientIp,
      checkin_day2_morning_device_model: deviceInfo.device_model,
      checkin_day2_morning_user_agent: deviceInfo.user_agent,
      checkin_day2_morning_platform: deviceInfo.platform,
      updatedAt: timestamp
    };

    if (db) {
      try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', firestoreDocId);
        batch.update(userRef, updatePayload);

        const logRef = doc(collection(db, 'registration_checkin_logs'));
        batch.set(logRef, {
          log_id: logRef.id,
          session: isDay1 ? 'day1_morning' : 'day2_morning',
          action: isDay1 ? 'CHECKIN_REGISTRATION_DAY1' : 'CHECKIN_REGISTRATION_DAY2',
          timestamp,
          student_doc_id: firestoreDocId,
          student_line_uid: currentStudent.line_uid || currentStudent.docId || '',
          student_id: currentStudent.studentId || currentStudent.id || '',
          student_short_code: currentStudent.short_code || currentStudent.walkin_temp_short_code || currentStudent.shortCode || '',
          student_group: currentStudent.group || currentStudent.assigned_group || currentStudent.assigned_group_name || '',
          student_name: `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim(),
          department: currentStudent.department || '',
          search_method: searchMethod,
          staff_line_uid: staffUid,
          staff_username: rawStaffUsername,
          staff_display_name: staffName,
          staff_role: staff?.role || '',
          staff_picture_url: staffPic,
          operator_user: rawStaffUsername || envCheckinOperatorUser,
          client_ip: clientIp,
          device_model: deviceInfo.device_model,
          user_agent: deviceInfo.user_agent,
          platform: deviceInfo.platform
        });

        await batch.commit();
      } catch (err) {
        console.error('Firestore registration checkin error:', err);
        return { success: false, error: err?.message || String(err) };
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

    return { success: true, timestamp, updatePayload, clientIp, deviceModel: deviceInfo.device_model, staffName, operatorUser: rawStaffUsername || envCheckinOperatorUser, isDay1 };
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
      liffLoading,
      triggerLiffLogin,
      lang,
      setLang,
      login,
      logout,
      findStudentByCode,
      findStudentByCodeDirect,
      confirmShirtPickup,
      revokeShirtPickup,
      approveWalkinRegistration,
      confirmRegistrationCheckin,
      fetchStudentsFromFirestore,
      updatePhysicalInventory,
      matchDepartment,
      formatDepartment,
      DEPT_ALIASES,
      DEPT_TRANSLATIONS_EN
    }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};
