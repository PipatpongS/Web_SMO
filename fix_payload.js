const fs = require('fs');
let content = fs.readFileSync('apps/student-reg/src/pages/StaffRegister.jsx', 'utf8');
content = content.replace('lastName: formData.lastName.trim(),\n    };', 'lastName: formData.lastName.trim(),\n    };\n\n    if (!isEditMode) {\n      trimmedData.staffStatus = "ส่งใบสมัครเสร็จสิ้น";\n    }');
content = content.replace('lastName: formData.lastName.trim(),\r\n    };', 'lastName: formData.lastName.trim(),\r\n    };\n\n    if (!isEditMode) {\n      trimmedData.staffStatus = "ส่งใบสมัครเสร็จสิ้น";\n    }');
fs.writeFileSync('apps/student-reg/src/pages/StaffRegister.jsx', content, 'utf8');
console.log('Fixed');
