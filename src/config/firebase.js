import { initializeApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// TODO: Replace with actual Firebase config from env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:mock-app-id"
};

// Initialize Firebase only if we have a real config, otherwise return dummy
let app, db = null;
if (import.meta.env.VITE_FIREBASE_API_KEY) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    // Enable Offline Persistence to prevent F5 spam from using read quota
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence failed.");
      } else if (err.code === 'unimplemented') {
        console.warn("Browser doesn't support persistence.");
      }
    });
    
    // Initialize App Check to prevent API spam
    if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      // In development, you might need to use a debug token or whitelist localhost.
      // Firebase automatically handles localhost in newer SDKs, but for strict mode,
      // self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; can be used here if needed.
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    }
  } catch (e) {
    console.warn("Firebase could not be initialized using the provided config", e);
  }
} else {
  console.warn("No Firebase API Key provided. Running in offline/mock mode.");
}

export { db };
