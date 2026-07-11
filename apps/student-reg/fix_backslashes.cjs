const fs = require('fs');
let code = fs.readFileSync('src/pages/StaffRegister.jsx', 'utf8');

// Replace double backslashes with single backslashes in regex literals
code = code.replace(/\\\\u/g, '\\u');
code = code.replace(/\\\\s/g, '\\s');
code = code.replace(/\\\\-/g, '\\-');
code = code.replace(/\\\\./g, '\\.');

fs.writeFileSync('src/pages/StaffRegister.jsx', code);
console.log('Fixed backslashes');
