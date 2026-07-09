import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT is not set in environment variables.");
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error.message);
  }
}

export default async function handler(req, res) {
  // CORS configuration for local development and production
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests for better security semantics (sending password in header)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate Authorization Header (Basic Auth)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid credentials' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const [username, password] = Buffer.from(base64Credentials, 'base64').toString('ascii').split(':');

  if (username !== process.env.STAFF_USERNAME || password !== process.env.STAFF_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Incorrect Username or Password' });
  }

  // Ensure Firebase Admin is initialized
  if (!getApps().length) {
    return res.status(500).json({ error: 'Server Configuration Error: Firebase Admin not initialized' });
  }

  try {
    const db = getFirestore();
    const usersRef = db.collection('users');

    // List of predefined departments
    const departments = [
      "วิศวกรรมคอมพิวเตอร์",
      "วิศวกรรมโยธา",
      "วิศวกรรมเคมี",
      "วิศวกรรมไฟฟ้า",
      "วิศวกรรมอิเล็กทรอนิกส์และโทรคมนาคม",
      "วิศวกรรมสิ่งแวดล้อม",
      "วิศวกรรมระบบควบคุมและเครื่องมือวัด",
      "วิศวกรรมเครื่องกล",
      "วิศวกรรมอุตสาหการ",
      "วิศวกรรมเครื่องมือและวัสดุ"
    ];

    // Create an array of Promises for all count queries to run concurrently
    const queries = [
      usersRef.count().get(), // Total 0
      usersRef.where('titlePrefix', 'in', ['นาย', 'Mr.']).count().get(), // Male 1
      usersRef.where('titlePrefix', 'in', ['นางสาว', 'Ms.', 'นาง', 'Mrs.']).count().get(), // Female 2
      usersRef.where('is_verified', '==', true).count().get(), // Verified 3
      usersRef.where('is_verified', '==', false).count().get() // Unverified 4
    ];

    // Add department queries (5 to 14)
    departments.forEach(dept => {
      queries.push(usersRef.where('department', '==', dept).count().get());
    });

    // Await all queries at once
    const results = await Promise.all(queries);

    const total = results[0].data().count;
    const maleCount = results[1].data().count;
    const femaleCount = results[2].data().count;
    const otherCount = total - (maleCount + femaleCount);

    const verifiedCount = results[3].data().count;
    const unverifiedCount = results[4].data().count;

    const genderData = [
      { name: 'ชาย', value: maleCount },
      { name: 'หญิง', value: femaleCount }
    ];
    if (otherCount > 0) {
      genderData.push({ name: 'อื่นๆ', value: otherCount });
    }

    const verifyData = [
      { name: 'ยังไม่พบข้อมูล', value: unverifiedCount },
      { name: 'ยืนยันตัวตนแล้ว', value: verifiedCount }
    ];

    const deptData = departments.map((dept, index) => ({
      name: dept,
      value: results[5 + index].data().count
    })).sort((a, b) => a.name.localeCompare(b.name, 'th'));

    // We also need to account for 'ไม่ระบุ' if total > sum of dept counts
    const sumDept = deptData.reduce((sum, d) => sum + d.value, 0);
    if (sumDept < total) {
      deptData.push({ name: 'ไม่ระบุ', value: total - sumDept });
    }

    // Return ONLY aggregated data
    res.status(200).json({
      total,
      genderData,
      verifyData,
      deptData
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error fetching data' });
  }
}
