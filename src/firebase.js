import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// PASTE YOUR FIREBASE CONFIG HERE
// Go to Firebase Console > Project Settings > Your apps > Config
// ═══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
