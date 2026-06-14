// ตั้งค่าเวลาเปิด-ปิดรับสมัคร (สามารถแก้ได้ที่นี่)
// รูปแบบเวลา: YYYY-MM-DDTHH:mm:ss+07:00 (เวลาไทย)

export const REGISTRATION_START_DATE = '2026-06-16T00:00:00+07:00';
export const REGISTRATION_END_DATE = '2026-07-24T23:59:00+07:00';

// ฟังก์ชันสำหรับเช็คว่าตอนนี้เปิดรับสมัครหรือยัง
export const isRegistrationOpen = () => {
  const now = new Date().getTime();
  const start = new Date(REGISTRATION_START_DATE).getTime();
  const end = new Date(REGISTRATION_END_DATE).getTime();
  return now >= start && now <= end;
};

// ฟังก์ชันสำหรับเช็คว่าเปิดรับสมัครไปหรือยัง (ยังไม่ถึงเวลาเปิด)
export const isBeforeRegistration = () => {
  const now = new Date().getTime();
  const start = new Date(REGISTRATION_START_DATE).getTime();
  return now < start;
};

// ฟังก์ชันสำหรับเช็คว่าปิดรับสมัครไปหรือยัง
export const isAfterRegistration = () => {
  const now = new Date().getTime();
  const end = new Date(REGISTRATION_END_DATE).getTime();
  return now > end;
};
