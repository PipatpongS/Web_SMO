export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

  if (!LINE_ACCESS_TOKEN) {
    return res.status(500).json({ message: 'Server configuration error: Missing LINE_ACCESS_TOKEN.' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId in request body.' });
  }

  try {
    // ถอดผูก Rich Menu ออกจาก User คนนี้
    // เมื่อถอดแล้ว User จะกลับไปใช้ Default Rich Menu (ก่อนลงทะเบียน) อัตโนมัติ
    const lineResponse = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
      }
    });

    if (!lineResponse.ok) {
      const errorData = await lineResponse.text();
      console.error('LINE API Error:', errorData);
      return res.status(502).json({ message: 'Failed to unlink rich menu', error: errorData });
    }

    return res.status(200).json({ success: true, message: 'Rich menu unlinked. User will see default menu.' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
