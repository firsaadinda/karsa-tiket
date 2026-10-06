import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Inisialisasi Firebase SDK dengan project mandiri Karsa Tiket
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB4_iVC_uQ8B77yhcDAdao2blRzQ8TUhPY",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "karsa-tiket-firsa.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "karsa-tiket-firsa",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "karsa-tiket-firsa.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "179947371601",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:179947371601:web:fee6b547d6a2c552b8cc70",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
