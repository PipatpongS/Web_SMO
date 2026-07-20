const fs = require('fs');
let content = fs.readFileSync('apps/student-reg/src/pages/StaffRegister.jsx', 'utf8');

content = content.replace('{step > 1 ? (\\n              <button\\n                type="button"\\n                onClick={() => handlePrev()}', '{step > 1 && !readOnly ? (\\n              <button\\n                type="button"\\n                onClick={() => handlePrev()}');

content = content.replace('{step > 1 ? (\\r\\n              <button\\r\\n                type="button"\\r\\n                onClick={() => handlePrev()}', '{step > 1 && !readOnly ? (\\n              <button\\n                type="button"\\n                onClick={() => handlePrev()}');

// Using regex just in case
content = content.replace(/\{step\s*>\s*1\s*\?\s*\(\s*<button\s*type="button"\s*onClick=\{\(\)\s*=>\s*handlePrev\(\)\}/g, '{step > 1 && !readOnly ? (\n              <button\n                type="button"\n                onClick={() => handlePrev()}');

fs.writeFileSync('apps/student-reg/src/pages/StaffRegister.jsx', content, 'utf8');
console.log('Replaced StaffRegister');

let content2 = fs.readFileSync('apps/student-reg/src/pages/Register.jsx', 'utf8');
content2 = content2.replace(/\{step\s*>\s*1\s*\?\s*\(\s*<button\s*type="button"\s*onClick=\{\(\)\s*=>\s*handlePrev\(\)\}/g, '{step > 1 && !readOnly ? (\n              <button\n                type="button"\n                onClick={() => handlePrev()}');
fs.writeFileSync('apps/student-reg/src/pages/Register.jsx', content2, 'utf8');
console.log('Replaced Register');
