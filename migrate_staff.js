const fs = require('fs');

const regContent = fs.readFileSync('apps/student-reg/src/contexts/RegContext.jsx', 'utf8');
let staffContent = regContent.replace(/RegContext/g, 'StaffRegContext')
                             .replace(/RegProvider/g, 'StaffRegProvider')
                             .replace(/useRegistration/g, 'useStaffRegistration')
                             .replace(/"users"/g, '"staff_applicants"')
                             .replace(/reg_/g, 'staff_reg_')
                             .replace(/not_reg_/g, 'not_staff_reg_')
                             .replace(/registerUser = async \(data, collectionName = "staff_applicants"\)/, 'registerUser = async (data)')
                             .replace(/updateUser = async \(data, collectionName = "staff_applicants"\)/, 'updateUser = async (data)')
                             .replace(/collectionName/g, '"staff_applicants"');
                             
fs.writeFileSync('apps/student-reg/src/contexts/StaffRegContext.jsx', staffContent, 'utf8');

// Patch App.jsx
let appContent = fs.readFileSync('apps/student-reg/src/App.jsx', 'utf8');
if (!appContent.includes('StaffRegProvider')) {
  appContent = appContent.replace("import { RegProvider, useRegistration } from './contexts/RegContext';", "import { RegProvider, useRegistration } from './contexts/RegContext';\nimport { StaffRegProvider } from './contexts/StaffRegContext';");
  appContent = appContent.replace("<RegProvider>", "<RegProvider>\n        <StaffRegProvider>");
  appContent = appContent.replace("</RegProvider>", "</StaffRegProvider>\n        </RegProvider>");
  fs.writeFileSync('apps/student-reg/src/App.jsx', appContent, 'utf8');
}

// Patch Staff pages
const pages = ['StaffHome.jsx', 'StaffProfile.jsx', 'StaffRegister.jsx'];
pages.forEach(page => {
  let pContent = fs.readFileSync(`apps/student-reg/src/pages/${page}`, 'utf8');
  pContent = pContent.replace(/import \{ useRegistration \} from '\.\.\/contexts\/RegContext';/, "import { useStaffRegistration } from '../contexts/StaffRegContext';");
  pContent = pContent.replace(/useRegistration/g, 'useStaffRegistration');
  if (page === 'StaffRegister.jsx') {
    pContent = pContent.replace(/registerUser\(trimmedData, "staff_applicants", "staff_applicants"\)/, "registerUser(trimmedData)");
  }
  fs.writeFileSync(`apps/student-reg/src/pages/${page}`, pContent, 'utf8');
});

console.log("Migration complete!");
