import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('../apps/staff-checkin/.env'));

const envAdminUser = (envConfig.VITE_STAFF_ADMIN_USER || 'rak_smo').trim().toLowerCase();
const envAdminPass = (envConfig.VITE_STAFF_ADMIN_PASS || 'Rak_vidva_!?').trim();

const envShirtOperatorUser = (envConfig.VITE_STAFF_OPERATOR_USER || 'shirt_check').trim().toLowerCase();
const envShirtOperatorPass = (envConfig.VITE_STAFF_OPERATOR_PASS || 'HB{lVtEE9jU').trim();

const envWalkinOperatorUser = (envConfig.VITE_STAFF_WALKIN_OPERATOR_USER || 'walkin_approve').trim().toLowerCase();
const envWalkinOperatorPass = (envConfig.VITE_STAFF_WALKIN_OPERATOR_PASS || 'HzA[HH1q~2').trim();

const envCheckinOperatorUser = (envConfig.VITE_STAFF_CHECKIN_OPERATOR_USER || 'reg_checkin').trim().toLowerCase();
const envCheckinOperatorPass = (envConfig.VITE_STAFF_CHECKIN_OPERATOR_PASS || 'Reg_vidva_2026!?').trim();

const DEPT_ACCOUNTS = [
  { dept: 'CPE', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_CPE_USER || 'cpe_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_CPE_PASS || 'IHJvT(jot^F').trim() },
  { dept: 'ME', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_ME_USER || 'me_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_ME_PASS || 'eu]III}@5z}').trim() },
  { dept: 'PE', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_PE_USER || 'pe_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_PE_PASS || ')crZbUg{1-E').trim() },
  { dept: 'CE', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_CE_USER || 'ce_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_CE_PASS || ']0nai=%NOOX').trim() },
  { dept: 'ENV', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_ENV_USER || 'env_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_ENV_PASS || 'WITqRd%Qg~U').trim() },
  { dept: 'CHE', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_CHE_USER || 'che_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_CHE_PASS || ')2gaev3Csp~').trim() },
  { dept: 'INC', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_INC_USER || 'inc_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_INC_PASS || 'DNf^KyhT%&q').trim() },
  { dept: 'EE', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_EE_USER || 'ee_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_EE_PASS || ')~P^qr([sX9').trim() },
  { dept: 'ENE', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_ENE_USER || 'ene_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_ENE_PASS || 'Qdp[{kSJ8L^').trim() },
  { dept: 'TME', u: (envConfig.VITE_STAFF_CHECKIN_DAY2_TME_USER || 'tme_checkin').trim().toLowerCase(), p: (envConfig.VITE_STAFF_CHECKIN_DAY2_TME_PASS || 'y4^BkxhH19M').trim() },
];

const testAccounts = [
  { role: 'SUPERVISOR', u: envAdminUser, p: envAdminPass },
  { role: 'SHIRT_OPERATOR', u: envShirtOperatorUser, p: envShirtOperatorPass },
  { role: 'WALKIN_OPERATOR', u: envWalkinOperatorUser, p: envWalkinOperatorPass },
  { role: 'CHECKIN_OPERATOR', u: envCheckinOperatorUser, p: envCheckinOperatorPass },
  ...DEPT_ACCOUNTS.map(a => ({ role: `CHECKIN_${a.dept}`, u: a.u, p: a.p }))
];

console.log("=== TESTING ALL 14 STAFF ACCOUNTS LOGIN ===");
testAccounts.forEach(acc => {
  const cleanUser = acc.u.trim().toLowerCase();
  const cleanPass = acc.p.trim();
  
  let match = false;
  if (cleanUser === envAdminUser && cleanPass === envAdminPass) match = true;
  else if (cleanUser === envShirtOperatorUser && cleanPass === envShirtOperatorPass) match = true;
  else if (cleanUser === envWalkinOperatorUser && cleanPass === envWalkinOperatorPass) match = true;
  else if (cleanUser === envCheckinOperatorUser && cleanPass === envCheckinOperatorPass) match = true;
  else {
    const matchDept = DEPT_ACCOUNTS.find(d => d.u === cleanUser && d.p === cleanPass);
    if (matchDept) match = true;
  }

  console.log(`[${match ? 'OK' : 'FAIL'}] Role: ${acc.role.padEnd(20)} Username: "${acc.u}" Password: "${acc.p}"`);
});
