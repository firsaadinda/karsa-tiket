// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB4_iVC_uQ8B77yhcDAdao2blRzQ8TUhPY",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "karsa-tiket-firsa.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "karsa-tiket-firsa",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "karsa-tiket-firsa.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "179947371601",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:179947371601:web:493574a4ca2e099eb8cc70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
