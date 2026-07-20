const fs = require('fs');
let ctxPath = 'apps/student-reg/src/contexts/StaffRegContext.jsx';
let ctx = fs.readFileSync(ctxPath, 'utf8');

// Fix the mangled start of updateUser
ctx = ctx.replace(/const updateUser = async \(data\) => \{\s*if \(!userProfile\) return \{ success: false, error: "Not authenticated" \};\s*const updateUser = async \(data\) => \{\s*if \(!userProfile\) return \{ success: false, error: "Not authenticated" \};\s*if \(!isRegistered \|\| !regData\) return \{ success: false, error: "No existing registration found" \};/g, 
  `const updateUser = async (data) => {
    if (!userProfile) return { success: false, error: "Not authenticated" };
    if (!isRegistered || !regData) return { success: false, error: "No existing registration found" };`);

// Re-add userId and shirtSize lock
ctx = ctx.replace(/const newEditCount = \(regData\.editCount \|\| 0\) \+ 1;/g, 
  `// Enforce lock for shirt size for EVERYONE
    if (data.shirtSize !== undefined && data.shirtSize !== regData.shirtSize) {
      return { success: false, error: "ไม่สามารถแก้ไขไซซ์เสื้อได้ หากต้องการแก้ไข โปรดติดต่อผ่านทีมงาน (LINE OA: @122ddost)" };
    }

    const userId = userProfile.userId;
    const newEditCount = (regData.editCount || 0) + 1;`);

fs.writeFileSync(ctxPath, ctx, 'utf8');
console.log("Fixed StaffRegContext.jsx syntax");
