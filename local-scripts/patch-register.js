import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../apps/student-reg/src/pages/Register.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const lockWrapper = (fieldName, inner) => `
                    <div onClickCapture={(e) => { if (isFieldLocked('${fieldName}')) { e.preventDefault(); e.stopPropagation(); setShowLockedModal(true); } }}>
                      ${inner}
                    </div>
`.trim();

// 1. Nationality
content = content.replace(
  /<div className="flex flex-col sm:flex-row gap-4 w-full">([\s\S]*?)<\/div>\s*<\/div>\s*\{formData\.nationality/g,
  (match, inner) => {
    let newInner = inner.replace(/<label className="([^"]+)">/g, `<label className={\`$1 \${isFieldLocked('nationality') ? 'opacity-60 cursor-not-allowed pointer-events-none bg-gray-100' : ''}\`}>`);
    return lockWrapper('nationality', `<div className="flex flex-col sm:flex-row gap-4 w-full">${newInner}</div>`) + '\n              </div>\n\n              {formData.nationality';
  }
);

// 2. Prefix (select)
content = content.replace(
  /<select name="titlePrefix"([\s\S]*?)<\/select>/g,
  (match) => {
    let replaced = match.replace(/className={`\$\{inputClass\}/, `className={\`\${inputClass} \${isFieldLocked('titlePrefix') ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none' : ''}`);
    return lockWrapper('titlePrefix', replaced);
  }
);

// 3. firstName, middleName, lastName
const textFields = ['firstName', 'middleName', 'lastName'];
textFields.forEach(field => {
  const regex = new RegExp(`<input type="text" name="${field}"([^>]+)className={inputClass}([^>]+)/>`, 'g');
  content = content.replace(regex, (match, p1, p2) => {
    let replaced = `<input type="text" name="${field}"${p1}className={\`\${inputClass} \${isFieldLocked('${field}') ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`}${p2}/>`;
    return lockWrapper(field, replaced);
  });
});

// 4. studentIdStatus
content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">([\s\S]*?)<\/div>\s*<\/div>\s*\{formData\.studentIdStatus === 'ได้รับรหัสนักศึกษาแล้ว'/g,
  (match, inner) => {
    let newInner = inner.replace(/<label className="([^"]+)">/g, `<label className={\`$1 \${isFieldLocked('studentIdStatus') ? 'opacity-60 cursor-not-allowed pointer-events-none bg-gray-100' : ''}\`}>`);
    return lockWrapper('studentIdStatus', `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">${newInner}</div>`) + '\n                  </div>\n\n                  {formData.studentIdStatus === \'ได้รับรหัสนักศึกษาแล้ว\'';
  }
);

// 5. studentId
content = content.replace(
  /<input\s+type="text"\s+name="studentId"([\s\S]*?)className={inputClass}([\s\S]*?)\/>/g,
  (match, p1, p2) => {
    let replaced = `<input type="text" name="studentId"${p1}className={\`\${inputClass} \${isFieldLocked('studentId') ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none' : ''}\`}${p2}/>`;
    return lockWrapper('studentId', replaced);
  }
);

// 6. department
content = content.replace(
  /<select name="department"([\s\S]*?)<\/select>/g,
  (match) => {
    let replaced = match.replace(/className={`\$\{inputClass\}/, `className={\`\${inputClass} \${isFieldLocked('department') ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none' : ''}`);
    return lockWrapper('department', replaced);
  }
);

// 7. program
content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">\s*<label className={radioLabelClass}>([\s\S]*?)<\/label>\s*<label className={radioLabelClass}>([\s\S]*?)<\/label>\s*<\/div>/g,
  (match, inner1, inner2) => {
    let replaced = `
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <label className={\`\${radioLabelClass} \${isFieldLocked('program') ? 'opacity-60 cursor-not-allowed pointer-events-none bg-gray-100' : ''}\`}>
${inner1}
                    </label>
                    <label className={\`\${radioLabelClass} \${isFieldLocked('program') ? 'opacity-60 cursor-not-allowed pointer-events-none bg-gray-100' : ''}\`}>
${inner2}
                    </label>
                  </div>`;
    return lockWrapper('program', replaced);
  }
);

// 8. shirtSize
content = content.replace(
  /<select name="shirtSize"([\s\S]*?)<\/select>/g,
  (match) => {
    let replaced = match.replace(/className={`\$\{inputClass\}/, `className={\`\${inputClass} \${isFieldLocked('shirtSize') ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none' : ''}`);
    return lockWrapper('shirtSize', replaced);
  }
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched Register.jsx successfully.");
