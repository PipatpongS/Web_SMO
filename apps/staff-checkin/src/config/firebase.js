import { initializeApp, getApps } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import liff from "@line/liff";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBr78uKh8F8gU6oNQbi7VvByPPUVonp4Cs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smo-vidva-bangmod.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smo-vidva-bangmod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smo-vidva-bangmod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "692203187728",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:692203187728:web:b6311f637541c8f0dd6495"
};

let app = null;
let db = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
} catch (e) {
  console.error("Firebase initialization error:", e);
}

// LIFF Initialization — safe, never auto-redirects, just returns profile if already logged in
export const initLiff = async () => {
  const liffId = import.meta.env.VITE_LIFF_ID || "2010390110-fPHy5j81";
  if (!liffId) return null;

  try {
    await liff.init({ liffId });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      return {
        line_uid: profile.userId,
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      };
    }
    // Not logged in to LIFF yet — do NOT redirect automatically
    return null;
  } catch (err) {
    console.warn("LIFF Init note:", err?.message || err);
  }
  return null;
};

// Explicit LINE Login Trigger — uses exact registered root Callback URL
export const liffLogin = async () => {
  const liffId = import.meta.env.VITE_LIFF_ID || "2010390110-fPHy5j81";
  try {
    await liff.init({ liffId });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      return {
        line_uid: profile.userId,
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      };
    } else {
      // Use exact root Callback URL matching LINE Developers console
      const callbackUrl = `${window.location.origin}/`;
      liff.login({ redirectUri: callbackUrl });
    }
  } catch (err) {
    console.error("liffLogin error:", err);
  }
  return null;
};

export { db, liff };
