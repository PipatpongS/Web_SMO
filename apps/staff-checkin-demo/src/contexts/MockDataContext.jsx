import React, { createContext, useContext, useState, useEffect } from 'react';

const MockDataContext = createContext();

// All Demo students scoped to 'วิศวกรรมคอมพิวเตอร์' with Short Codes formatted as 2 Letters + 2 Digits (e.g. CP01 - CP20)
const initialData = [
  { id: "69070500001", firstName: "สมชาย", lastName: "ใจดี", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP01", phone: "081-234-5678", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T09:00:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:15:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500002", firstName: "สมหญิง", lastName: "เรียนเก่ง", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP02", phone: "089-876-5432", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T09:05:00Z", checkin_day0_shirt_by: "Staff CPE", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:17:00Z", checkin_day1_morning_by: "Staff CPE", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500003", firstName: "พิพัฒนพงศ์", lastName: "รักเรียน", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP03", phone: "092-345-6789", checkin_day0_shirt: false, proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:20:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500004", firstName: "กานดา", lastName: "งามสมอน", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP04", phone: "083-111-2222", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T10:00:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:22:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500005", firstName: "ชลธิชา", lastName: "สว่างจิตต์", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP05", phone: "084-222-3333", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T10:15:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:25:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500006", firstName: "ณัฐพงษ์", lastName: "วรโชติ", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP06", phone: "085-333-4444", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T10:30:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:28:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500007", firstName: "ธนกฤต", lastName: "เจริญสุข", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP07", phone: "086-444-5555", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T10:45:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:30:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500008", firstName: "ปรียานุช", lastName: "ศรีสุวรรณ", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP08", phone: "087-555-6666", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T11:00:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:32:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500009", firstName: "พงศธร", lastName: "รัตนโชติ", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP09", phone: "088-666-7777", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T11:15:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:35:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500010", firstName: "ภาวิตา", lastName: "พิพัฒนา", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP10", phone: "089-777-8888", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T11:30:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:38:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500011", firstName: "วรเมธ", lastName: "ชัยพรหม", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP11", phone: "090-888-9999", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T11:45:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:40:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500012", firstName: "ศุภกร", lastName: "ตระกูลทอง", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP12", phone: "091-000-1111", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T12:00:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:45:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500013", firstName: "อนันต์", lastName: "ทรัพย์มหาศาล", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP13", phone: "092-111-2222", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T13:00:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:50:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500014", firstName: "อารียา", lastName: "สุขเจริญ", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP14", phone: "093-222-3333", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T13:15:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T08:55:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500015", firstName: "เอกชัย", lastName: "เลิศวิจิตร", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP15", phone: "094-333-4444", checkin_day0_shirt: true, checkin_day0_shirt_timestamp: "2026-07-24T13:30:00Z", checkin_day0_shirt_by: "Admin Staff", proxy_name: "", checkin_day1_morning: true, checkin_day1_morning_timestamp: "2026-07-25T09:00:00Z", checkin_day1_morning_by: "Admin Staff", checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },

  // 5 Pending Students
  { id: "69070500016", firstName: "กฤติน", lastName: "วงษ์สวรรค์", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP16", phone: "095-444-5555", checkin_day0_shirt: false, proxy_name: "", checkin_day1_morning: false, checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500017", firstName: "จิรายุ", lastName: "เพชรไพลิน", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP17", phone: "096-555-6666", checkin_day0_shirt: false, proxy_name: "", checkin_day1_morning: false, checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500018", firstName: "ชญานิน", lastName: "เกียรติสมบัติ", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP18", phone: "097-666-7777", checkin_day0_shirt: false, proxy_name: "", checkin_day1_morning: false, checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500019", firstName: "ณิชารีย์", lastName: "อมรรัตน์", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP19", phone: "098-777-8888", checkin_day0_shirt: false, proxy_name: "", checkin_day1_morning: false, checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
  { id: "69070500020", firstName: "ดนัย", lastName: "ประเสริฐยิ่ง", department: "วิศวกรรมคอมพิวเตอร์", shortCode: "CP20", phone: "099-888-9999", checkin_day0_shirt: false, proxy_name: "", checkin_day1_morning: false, checkin_day1_afternoon: false, checkin_day2_morning: false, checkin_day2_afternoon: false },
];

export const MockDataProvider = ({ children }) => {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('demo_students');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate to 2 Letters + 2 Digits shortCode format
      if (parsed.length > 0 && parsed[0].shortCode && !/^[A-Z]{2}[0-9]{2}$/.test(parsed[0].shortCode)) {
        return initialData;
      }
      return parsed;
    }
    return initialData;
  });

  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('demo_staff');
    return saved ? JSON.parse(saved) : { name: 'Staff CPE', department: 'วิศวกรรมคอมพิวเตอร์' };
  });

  const [lang, setLangState] = useState(() => localStorage.getItem('preferredLang') || 'TH');

  const setLang = (newLang) => {
    localStorage.setItem('preferredLang', newLang);
    setLangState(newLang);
  };

  useEffect(() => {
    localStorage.setItem('demo_students', JSON.stringify(students));
  }, [students]);

  const login = (username, password) => {
    if (username === 'admin' && password === 'admin') {
      const user = { name: 'Admin Staff', department: 'วิศวกรรมคอมพิวเตอร์' };
      setStaff(user);
      localStorage.setItem('demo_staff', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setStaff(null);
    localStorage.removeItem('demo_staff');
  };

  const findStudentByCode = (code) => {
    // Search by shortCode (case-insensitive) or ID
    const searchUpper = code.trim().toUpperCase();
    let found = students.find(s => s.shortCode.toUpperCase() === searchUpper || s.id === searchUpper);

    // Dynamic Mock for Real QR Code Testing
    // If a long string (like a real QR code payload) is scanned and not found, auto-generate "รัก รักสะอาด"
    if (!found && code.trim().length > 4) {
      const qrId = code.trim();
      // Only generate if it doesn't already exist to prevent duplicates
      const existingDynamic = students.find(s => s.id === qrId);
      if (existingDynamic) return existingDynamic;

      const newStudent = {
        id: qrId,
        firstName: "รัก",
        lastName: "รักสะอาด",
        department: "วิศวกรรมคอมพิวเตอร์",
        shortCode: "RK99",
        phone: "099-999-9999",
        checkin_day0_shirt: false,
        proxy_name: "",
        checkin_day1_morning: false,
        checkin_day1_afternoon: false,
        checkin_day2_morning: false,
        checkin_day2_afternoon: false
      };
      // For immediate return in this cycle, since state update is async
      setTimeout(() => {
        setStudents(prev => [...prev, newStudent]);
      }, 0);
      return newStudent;
    }

    return found;
  };

  const updateCheckin = (studentId, field, value, proxyName = "") => {
    const timestamp = new Date().toISOString();
    const byStaff = staff ? staff.name : 'Unknown Staff';

    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          [field]: value,
          // Transparent logging: save who and when
          ...(value === true ? {
            [`${field}_timestamp`]: timestamp,
            [`${field}_by`]: byStaff
          } : {
             [`${field}_timestamp`]: null,
             [`${field}_by`]: null
          }),
          ...(field === 'checkin_day0_shirt' ? { proxy_name: proxyName } : {}) 
        };
      }
      return s;
    }));
  };

  return (
    <MockDataContext.Provider value={{ 
      students, 
      staff, 
      login, 
      logout, 
      findStudentByCode, 
      updateCheckin,
      lang,
      setLang
    }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => useContext(MockDataContext);
