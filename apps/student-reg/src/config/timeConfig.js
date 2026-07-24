// ตั้งค่าเวลาเปิด-ปิดรับสมัคร (สามารถแก้ได้ที่นี่)
// รูปแบบเวลา: YYYY-MM-DDTHH:mm:ss+07:00 (เวลาไทย)

export const REGISTRATION_START_DATE = import.meta.env.VITE_REGISTRATION_START_DATE || '2026-06-15T00:00:00+07:00';
export const REGISTRATION_END_DATE = import.meta.env.VITE_REGISTRATION_END_DATE || '2026-07-31T23:59:59+07:00';
export const EDIT_DEADLINE = import.meta.env.VITE_EDIT_DEADLINE || '2026-07-31T23:59:59+07:00';

export const STAFF_REGISTRATION_START_DATE = import.meta.env.VITE_STAFF_REGISTRATION_START_DATE || '2026-07-10T00:00:00+07:00';
export const STAFF_REGISTRATION_END_DATE = import.meta.env.VITE_STAFF_REGISTRATION_END_DATE || '2026-07-17T23:59:59+07:00';
export const STAFF_EDIT_DEADLINE = import.meta.env.VITE_STAFF_EDIT_DEADLINE || '2026-07-17T23:59:59+07:00';

export const isRegistrationOpen = () => {
  const now = new Date().getTime();
  const start = new Date(REGISTRATION_START_DATE).getTime();
  const end = new Date(REGISTRATION_END_DATE).getTime();
  return now >= start && now <= end;
};

export const isStaffRegistrationOpen = () => {
  const now = new Date().getTime();
  const start = new Date(STAFF_REGISTRATION_START_DATE).getTime();
  const end = new Date(STAFF_REGISTRATION_END_DATE).getTime();
  return now >= start && now <= end;
};

export const isBeforeRegistration = () => {
  const now = new Date().getTime();
  const start = new Date(REGISTRATION_START_DATE).getTime();
  return now < start;
};

export const isBeforeStaffRegistration = () => {
  const now = new Date().getTime();
  const start = new Date(STAFF_REGISTRATION_START_DATE).getTime();
  return now < start;
};

export const isAfterRegistration = () => {
  const now = new Date().getTime();
  const end = new Date(REGISTRATION_END_DATE).getTime();
  return now > end;
};

export const isAfterStaffRegistration = () => {
  const now = new Date().getTime();
  const end = new Date(STAFF_REGISTRATION_END_DATE).getTime();
  return now > end;
};

export const isEditClosed = () => {
  const now = new Date().getTime();
  const end = new Date(EDIT_DEADLINE).getTime();
  return now > end;
};

export const isStaffEditClosed = () => {
  const now = new Date().getTime();
  const end = new Date(STAFF_EDIT_DEADLINE).getTime();
  return now > end;
};
