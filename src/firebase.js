import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || "AIzaSyCs0Mw8A4ZgrFDItcJRIB1DvVP9w2KXRyw",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || "brain-index-6a1f7.firebaseapp.com",
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "brain-index-6a1f7",
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET || "brain-index-6a1f7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_ID || "1040791594551",
  appId: import.meta.env.VITE_FB_APP_ID || "1:1040791594551:web:fa5fd62f72d920b47101b2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
