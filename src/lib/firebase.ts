import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC4tTvgbs-tRDFIXHus4BItDnLlxxpmiBk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "klyro-tech-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "klyro-tech-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "klyro-tech-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "373369224707",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:373369224707:web:c7b67b4552f9af013fd836"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
