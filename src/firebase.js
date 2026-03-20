import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCs0Mw8A4ZgrFDItcJRIB1DvVP9w2KXRyw",
  authDomain: "brain-index-6a1f7.firebaseapp.com",
  projectId: "brain-index-6a1f7",
  storageBucket: "brain-index-6a1f7.firebasestorage.app",
  messagingSenderId: "1040791594551",
  appId: "1:1040791594551:web:fa5fd62f72d920b47101b2",
  measurementId: "G-YVVL2CGHXY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
