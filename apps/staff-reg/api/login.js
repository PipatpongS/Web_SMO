export default async function handler(req, res) {
  // CORS configuration for local development and production
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

  if (username === process.env.STAFF_USERNAME && password === process.env.STAFF_PASSWORD) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Unauthorized: Incorrect Username or Password' });
  }
}
