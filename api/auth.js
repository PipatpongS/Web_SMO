import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
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
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // 1. Verify the LINE access token
    const verifyResponse = await fetch(`https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`);
    const verifyData = await verifyResponse.json();

    if (verifyData.error) {
      console.error("LINE Token Verification Error:", verifyData);
      return res.status(401).json({ error: 'Invalid access token', details: verifyData.error_description });
    }

    // Ensure the token belongs to our LIFF App (Client ID)
    const expectedClientId = process.env.LINE_CHANNEL_ID; // The Channel ID of the LINE Login channel
    if (expectedClientId && verifyData.client_id !== expectedClientId) {
      return res.status(401).json({ error: 'Token does not match expected Channel ID' });
    }

    // 2. Get the User Profile to get the LINE UID
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const profileData = await profileResponse.json();

    if (profileData.error || !profileData.userId) {
      console.error("LINE Profile Error:", profileData);
      return res.status(401).json({ error: 'Failed to get user profile' });
    }

    const lineUserId = profileData.userId;

    // 3. Generate Firebase Custom Token
    const customToken = await admin.auth().createCustomToken(lineUserId);

    // 4. Return the token
    return res.status(200).json({ 
      customToken,
      userId: lineUserId 
    });

  } catch (error) {
    console.error("Auth API Error:", error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
