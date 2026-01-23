import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Helper to safely access env vars in browser without crashing if process is undefined
const getEnvVar = (key: string, defaultValue: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const firebaseConfig = {
  apiKey: getEnvVar("NEXT_PUBLIC_FIREBASE_API_KEY", "demo-api-key"),
  authDomain: getEnvVar("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "roaster-os.firebaseapp.com"),
  projectId: getEnvVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "roaster-os"),
  storageBucket: getEnvVar("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "roaster-os.appspot.com"),
  messagingSenderId: getEnvVar("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "1234567890"),
  appId: getEnvVar("NEXT_PUBLIC_FIREBASE_APP_ID", "1:1234567890:web:abcdef123456")
};

// Singleton pattern for Next.js hot reloads to prevent multiple instance errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use standard getFirestore() directly. 
// This avoids the "Firestore has already been started" error that occurs
// when trying to configure tabManager persistence during hot-reloading.
export const db = getFirestore(app);
export const auth = getAuth(app);