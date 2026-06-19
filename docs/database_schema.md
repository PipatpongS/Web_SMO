# โครงสร้างฐานข้อมูล (Database Schema) ของระบบลงทะเบียน

ข้อมูลทั้งหมดจะถูกจัดเก็บใน Firestore ภายใต้ **Collection `users`** โดยเรียงลำดับ Column ตามขั้นตอนที่ผู้ใช้กรอกในหน้าเว็บจริงๆ ดังนี้ครับ:

## Step 1: ข้อมูลส่วนบุคคลและติดต่อ (General Info)
1. `nationality` *(String)* : สัญชาติ ('Thai national' / 'International student')
2. `titlePrefix` *(String)* : คำนำหน้าชื่อ ('Mr.' / 'Ms.' / 'Mrs.')
3. `firstName` *(String)* : ชื่อจริง
4. `middleName` *(String)* : ชื่อกลาง (ถ้าไม่มีจะเป็นค่าว่าง)
5. `lastName` *(String)* : นามสกุล
6. `email` *(String)* : อีเมล
7. `phone` *(String)* : เบอร์โทรศัพท์
8. `studentIdStatus` *(String)* : สถานะรหัสนักศึกษา ('received' / 'not_received')
9. `studentId` *(String)* : รหัสนักศึกษา 11 หลัก (ถ้าเลือก 'received' ถึงจะมีข้อมูลส่วนนี้)

## Step 2: ข้อมูลการศึกษา (Education Info)
10. `department` *(String)* : ภาควิชา (เช่น 'Computer Engineering')
11. `program` *(String)* : โครงการที่ศึกษา ('Regular Program' / 'International Program')

## Step 3: ข้อมูลสำหรับการจัดกิจกรรม (Activity Info)
12. `shirtSize` *(String)* : ไซซ์เสื้อที่เลือก (เช่น 'S', 'M', 'L')
13. `joinActivity` *(String)* : การยืนยันเข้าร่วมกิจกรรม ('เข้าร่วม' / 'ไม่เข้าร่วม')

*(ข้อมูลด้านล่างนี้จะมีค่าก็ต่อเมื่อเลือก 'เข้าร่วม' เท่านั้น)*
14. `hasDietaryRestriction` *(String)* : มีข้อจำกัดด้านอาหารหรือไม่ ('มี' / 'ไม่มี')
15. `dietaryRestriction` *(Array)* : รายการข้อจำกัดอาหาร (เช่น `['มังสวิรัติ', 'แพ้อาหารบางชนิด']`)
16. `foodAllergyDetails` *(String)* : กรอกรายละเอียดแพ้อาหารเพิ่มเติม
17. `dietaryOther` *(String)* : กรอกข้อจำกัดอาหารอื่นๆ เพิ่มเติม
18. `hasMedicalCondition` *(String)* : มีโรคประจำตัวหรือไม่ ('มี' / 'ไม่มี')
19. `medicalConditionDetails` *(String)* : กรอกรายละเอียดโรคประจำตัว

## Step 4: เงื่อนไขและการยินยอม (Terms and Consent)
20. `pdpaConsent` *(Boolean)* : การกดยินยอมข้อมูล PDPA (`true` / `false`)

---

## ข้อมูลสถานะของระบบ (System Flags)
21. `createdAt` *(String)* : วันและเวลาที่กดลงทะเบียนสำเร็จ (เช่น `"2026-06-14T10:00:00.000Z"`)
22. `updatedAt` *(String)* : วันและเวลาที่มีการอัปเดตข้อมูลล่าสุด (เช่น ตอนแก้ไขข้อมูล หรือตอนถูกเช็คชื่อ)
23. `checkin_day1_morning` *(String หรือ null)* : 🟢 เวลาที่เช็คชื่อเข้างาน (เช้าวันที่ 25 ก.ค. 69) ถ้ายังไม่เช็คจะเป็น `null`
24. `checkin_day1_afternoon` *(String หรือ null)* : 🟢 เวลาที่เช็คชื่อเข้างาน (บ่ายวันที่ 25 ก.ค. 69) ถ้ายังไม่เช็คจะเป็น `null`
25. `checkin_day2_morning` *(String หรือ null)* : 🟢 เวลาที่เช็คชื่อเข้างาน (เช้าวันที่ 26 ก.ค. 69) ถ้ายังไม่เช็คจะเป็น `null`
26. `checkin_day2_afternoon` *(String หรือ null)* : 🟢 เวลาที่เช็คชื่อเข้างาน (บ่ายวันที่ 26 ก.ค. 69) ถ้ายังไม่เช็คจะเป็น `null`
27. `shirt_received_at` *(String หรือ null)* : 🟢 เวลาที่มารับเสื้อ ถ้ายังไม่รับจะเป็น `null`
28. `is_verified` *(Boolean)* : 🟢 สถานะการยืนยันตัวตน (สตาฟฟ์เอาไว้เทียบกับฐานข้อมูลมหาลัย) เริ่มต้นเป็น `false`

---

### 💡 วิธีแก้และเพิ่ม Field ด้วยตัวเอง
ความเจ๋งของ Firebase คือคุณไม่ต้องไปสร้างตารางในเว็บเลยครับ! 
ถ้าคุณอยากเพิ่มคำถามเช่น "กรุ๊ปเลือด" ใน Step 1 ให้ทำตามนี้:
1. เปิดไฟล์ `src/pages/Register.jsx`
2. เลื่อนไปที่บรรทัดประมาณ `196` (ตรงคำว่า `const [formData, setFormData] = useState(...)`)
3. เพิ่มตัวแปรเข้าไปเลยครับ เช่น `bloodGroup: '',`
4. วาดช่อง Input หน้าเว็บให้เก็บค่าใส่ `bloodGroup`
5. พอกด **ยืนยันลงทะเบียน** ข้อมูลจะถูกส่งเข้า Firebase เก็บให้อัตโนมัติทันที!
