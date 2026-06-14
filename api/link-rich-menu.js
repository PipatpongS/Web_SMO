export default async function handler(req, res) {
  // 1. รับเฉพาะ Method POST เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. ดึงค่า Token และ Rich Menu ID จาก Environment Variable ของ Vercel
  const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
  const AFTER_REGISTER_RICH_MENU_ID = process.env.AFTER_REGISTER_RICH_MENU_ID;

  if (!LINE_ACCESS_TOKEN || !AFTER_REGISTER_RICH_MENU_ID) {
    return res.status(500).json({ message: 'Server configuration error: Missing LINE tokens.' });
  }

  // 3. ดึง userId จาก Request Body
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId in request body.' });
  }

  try {
    // 4. ส่งคำสั่งไปที่ LINE Messaging API เพื่อผูก Rich Menu กับ User คนนี้
    const lineResponse = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${AFTER_REGISTER_RICH_MENU_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
      }
    });

    if (!lineResponse.ok) {
      const errorData = await lineResponse.json();
      console.error('LINE API Error:', errorData);
      return res.status(502).json({ message: 'Failed to link rich menu via LINE API', error: errorData });
    }

    // สำเร็จ!
    return res.status(200).json({ success: true, message: 'Rich menu linked successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
