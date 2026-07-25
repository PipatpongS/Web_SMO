// ตั้งค่าเวลาเปิด-ปิดรับสมัคร (สามารถแก้ได้ที่นี่)
// รูปแบบเวลา: YYYY-MM-DDTHH:mm:ss+07:00 (เวลาไทย)

export const REGISTRATION_START_DATE = '2020-01-01T00:00:00+07:00';
export const REGISTRATION_END_DATE = '2030-12-31T23:59:59+07:00';
export const EDIT_DEADLINE = '2030-12-31T23:59:59+07:00';

export const STAFF_REGISTRATION_START_DATE = '2020-01-01T00:00:00+07:00';
export const STAFF_REGISTRATION_END_DATE = '2030-12-31T23:59:59+07:00';
export const STAFF_EDIT_DEADLINE = '2030-12-31T23:59:59+07:00';

export const isRegistrationOpen = () => true;
export const isStaffRegistrationOpen = () => true;

export const isBeforeRegistration = () => false;
export const isBeforeStaffRegistration = () => false;

export const isAfterRegistration = () => false;
export const isAfterStaffRegistration = () => false;

export const isEditClosed = () => false;
export const isStaffEditClosed = () => false;
