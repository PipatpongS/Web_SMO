const DEPT_TRANSLATIONS_TH = {
  "CPE": "วิศวกรรมคอมพิวเตอร์",
  "CE": "วิศวกรรมโยธา",
  "CHE": "วิศวกรรมเคมี",
  "EE": "วิศวกรรมไฟฟ้า",
  "ENE": "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม",
  "ENV": "วิศวกรรมสิ่งแวดล้อม",
  "INC": "วิศวกรรมระบบควบคุมและเครื่องมือวัด",
  "ME": "วิศวกรรมเครื่องกล",
  "PE": "วิศวกรรมอุตสาหการ",
  "TME": "วิศวกรรมเครื่องมือและวัสดุ",

  "วิศวกรรมคอมพิวเตอร์": "วิศวกรรมคอมพิวเตอร์",
  "วิศวกรรมโยธา": "วิศวกรรมโยธา",
  "วิศวกรรมเคมี": "วิศวกรรมเคมี",
  "วิศวกรรมไฟฟ้า": "วิศวกรรมไฟฟ้า",
  "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม": "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม",
  "วิศวกรรมสิ่งแวดล้อม": "วิศวกรรมสิ่งแวดล้อม",
  "วิศวกรรมระบบควบคุมและเครื่องมือวัด": "วิศวกรรมระบบควบคุมและเครื่องมือวัด",
  "วิศวกรรมเครื่องกล": "วิศวกรรมเครื่องกล",
  "วิศวกรรมอุตสาหการ": "วิศวกรรมอุตสาหการ",
  "วิศวกรรมเครื่องมือและวัสดุ": "วิศวกรรมเครื่องมือและวัสดุ"
};

const DEPT_TRANSLATIONS_EN = {
  "CPE": "Computer Engineering",
  "CE": "Civil Engineering",
  "CHE": "Chemical Engineering",
  "EE": "Electrical Engineering",
  "ENE": "Electronics and Telecommunication Engineering",
  "ENV": "Environmental Engineering",
  "INC": "Control Systems and Instrumentation Engineering",
  "ME": "Mechanical Engineering",
  "PE": "Production Engineering",
  "TME": "Tool and Materials Engineering",

  "วิศวกรรมคอมพิวเตอร์": "Computer Engineering",
  "วิศวกรรมโยธา": "Civil Engineering",
  "วิศวกรรมเคมี": "Chemical Engineering",
  "วิศวกรรมไฟฟ้า": "Electrical Engineering",
  "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม": "Electronics and Telecommunication Engineering",
  "วิศวกรรมสิ่งแวดล้อม": "Environmental Engineering",
  "วิศวกรรมระบบควบคุมและเครื่องมือวัด": "Control Systems and Instrumentation Engineering",
  "วิศวกรรมเครื่องกล": "Mechanical Engineering",
  "วิศวกรรมอุตสาหการ": "Production Engineering",
  "วิศวกรรมเครื่องมือและวัสดุ": "Tool and Materials Engineering"
};

const formatDepartment = (deptRaw, isTH = true) => {
  if (!deptRaw) return isTH ? 'วิศวกรรมคอมพิวเตอร์' : 'Computer Engineering';
  const deptStr = String(deptRaw).trim();
  if (isTH) {
    return DEPT_TRANSLATIONS_TH[deptStr] || deptStr;
  } else {
    return DEPT_TRANSLATIONS_EN[deptStr] || deptStr;
  }
};

const depts = ["CPE", "CE", "CHE", "EE", "ENE", "ENV", "INC", "ME", "PE", "TME"];

console.log("| Short Code | Full Thai Name | Full English Name |");
console.log("| :--- | :--- | :--- |");
depts.forEach(code => {
  console.log(`| **${code}** | ${formatDepartment(code, true)} | ${formatDepartment(code, false)} |`);
});
