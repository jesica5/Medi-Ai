import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'YOUR_FIREBASE_API_KEY')
    ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    : 'AIzaSyMockKeyForDevTesting123456789',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'medi-ai-1bead.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'medi-ai-1bead',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'medi-ai-1bead.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '509645038432',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:509645038432:web:8591ee6082aeb8e7ecb405',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-J7Y6SD593D',
};

// Singleton Firebase Instance Helpers
let firebaseAppInstance: any = null;
let firebaseDbInstance: any = null;

export function getFirebaseApp() {
  if (!firebaseAppInstance) {
    firebaseAppInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return firebaseAppInstance;
}

export function getFirebaseDb() {
  if (!firebaseDbInstance) {
    try {
      firebaseDbInstance = getFirestore(getFirebaseApp());
    } catch (err) {
      console.warn('[Firestore Init Warning]:', err);
    }
  }
  return firebaseDbInstance;
}

/**
 * Firestore Helper Service for MediAI Data Management
 * Handles patient profiles, medical history, triage assessments, risk predictions, and medication records.
 */
export class FirestoreService {
  // 1. Save Triage Assessment & Risk Prediction Record
  public static async saveTriageAssessment(assessment: any): Promise<string> {
    try {
      const db = getFirebaseDb();
      if (!db) return `doc_${Date.now()}`;
      const assessmentsRef = collection(db, 'triage_assessments');
      const docRef = await addDoc(assessmentsRef, {
        ...assessment,
        saved_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      // Graceful offline fallback during tests or missing credentials
      return `doc_${Date.now()}`;
    }
  }

  // 2. Save Patient Profile & Medical History
  public static async savePatientProfile(patientId: string, profileData: any): Promise<void> {
    try {
      const db = getFirebaseDb();
      if (!db) return;
      const patientRef = doc(db, 'patient_profiles', patientId);
      await setDoc(patientRef, {
        ...profileData,
        updated_at: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.warn('[Firestore] Error saving patient profile:', error);
    }
  }

  // 3. Save Patient Medication Information
  public static async saveMedicationRecord(patientId: string, medicationData: any): Promise<string> {
    try {
      const db = getFirebaseDb();
      if (!db) return `med_${Date.now()}`;
      const medRef = collection(db, 'patient_medications');
      const docRef = await addDoc(medRef, {
        patient_id: patientId,
        ...medicationData,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.warn('[Firestore] Error saving medication record:', error);
      return `med_${Date.now()}`;
    }
  }
}
