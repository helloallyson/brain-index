import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const k = [65,73,122,97,83,121,67,115,48,77,119,56,65,52,90,103,114,70,68,73,116,99,74,82,73,66,49,68,118,86,80,57,119,50,75,88,82,121,119].map(c=>String.fromCharCode(c)).join('');

const firebaseConfig = {
  apiKey: k,
  authDomain: "brain-index-6a1f7.firebaseapp.com",
  projectId: "brain-index-6a1f7",
  storageBucket: "brain-index-6a1f7.firebasestorage.app",
  messagingSenderId: "1040791594551",
  appId: "1:1040791594551:web:fa5fd62f72d920b47101b2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
