import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'medi-ai-1bead.firebaseapp.com',
  projectId: 'medi-ai-1bead',
  storageBucket: 'medi-ai-1bead.firebasestorage.app',
  messagingSenderId: '509645038432',
  appId: '1:509645038432:web:8591ee6082aeb8e7ecb405',
  measurementId: 'G-J7Y6SD593D',
};

// Singleton Firebase initialization (safe for both browser and server runtime)
let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch {
  // Graceful fallback for test/mock environments where env vars may be uninitialized
  app = {} as FirebaseApp;
}

export { app, auth, db };
