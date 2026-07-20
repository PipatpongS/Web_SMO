const fs = require('fs');

const fixFile = (path) => {
  let f = fs.readFileSync(path, 'utf8');
  
  // 1. Add ำ to invalidFirstChars
  f = f.replace(/const invalidFirstChars = \/\^\[ุึัี้่ิืูํ๊็๋์ะา\]\+\/;/g, 'const invalidFirstChars = /^[ุึัี้่ิืูํ๊็๋์ะาำ]+/;');
  
  // 2. Add nickname to the name array
  f = f.replace(/if \(\['firstName', 'middleName', 'lastName'\]\.includes\(name\) && typeof newValue === 'string'\) \{/g, "if (['firstName', 'middleName', 'lastName', 'nickname'].includes(name) && typeof newValue === 'string') {");
  
  // 3. Fix IME composition bypass by using a timeout
  f = f.replace(
    /newValue = newValue\.replace\(invalidFirstChars, ''\);\n      \}/g,
    "newValue = newValue.replace(invalidFirstChars, '');\n        setTimeout(() => {\n          if (e.target && e.target.value !== newValue) {\n            e.target.value = newValue;\n          }\n        }, 0);\n      }"
  );

  fs.writeFileSync(path, f);
  console.log(`Updated ${path}`);
};

fixFile('apps/student-reg/src/pages/StaffRegister.jsx');
fixFile('apps/student-reg/src/pages/Register.jsx');
