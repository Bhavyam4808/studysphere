/**
 * StudySphere - Firebase Client Configuration
 * ============================================
 * Included for hackathon architecture demonstration.
 * Configures Firebase Auth, Firestore, and Storage with environment variables.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyStudySphereHackathon2026",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "studysphere-edu.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "studysphere-edu",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "studysphere-edu.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
