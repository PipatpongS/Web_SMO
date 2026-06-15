import crypto from 'crypto';

function createFirebaseCustomToken(uid, serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat,
    exp,
    uid
  };
  
  const encodeB64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${encodeB64Url(header)}.${encodeB64Url(payload)}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  // Ensure private key handles newlines correctly
  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const signature = sign.sign(privateKey, 'base64url');
  
  return `${unsignedToken}.${signature}`;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing in Vercel Environment Variables");
    }
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON. Make sure you copied the exact JSON content.");
    }

    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // 1. Verify LINE access token with LINE API
    const lineVerifyResponse = await fetch(`https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`);
    
    if (!lineVerifyResponse.ok) {
      const errorData = await lineVerifyResponse.json();
      console.error('LINE Verification Error:', errorData);
      return res.status(401).json({ error: 'Invalid access token', details: errorData });
    }

    const verifyData = await lineVerifyResponse.json();
    const expectedClientId = process.env.LINE_CHANNEL_ID;
    if (expectedClientId && verifyData.client_id !== expectedClientId) {
      return res.status(401).json({ error: 'Token was not issued for this channel' });
    }

    // 2. Get user profile from LINE using the token
    const lineProfileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!lineProfileResponse.ok) {
      const errorData = await lineProfileResponse.json();
      console.error('LINE Profile Error:', errorData);
      return res.status(401).json({ error: 'Failed to fetch user profile', details: errorData });
    }

    const profileData = await lineProfileResponse.json();
    const lineUserId = profileData.userId;

    // 3. Generate Firebase Custom Token using pure crypto
    const customToken = createFirebaseCustomToken(lineUserId, serviceAccount);

    // 4. Return the token
    return res.status(200).json({ 
      success: true, 
      customToken 
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
