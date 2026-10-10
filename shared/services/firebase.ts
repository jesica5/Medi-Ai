import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY',
  authDomain: 'medi-ai-1bead.firebaseapp.com',
  projectId: 'medi-ai-1bead',
  storageBucket: 'medi-ai-1bead.firebasestorage.app',
  messagingSenderId: '509645038432',
  appId: '1:509645038432:web:8591ee6082aeb8e7ecb405',
  measurementId: 'G-J7Y6SD593D',
};

// Singleton Firebase Instance Helpers
let firebaseAppInstance: any = null;
let firebaseAuthInstance: any = null;
let firebaseDbInstance: any = null;

export function getFirebaseApp() {
  if (!firebaseAppInstance) {
    firebaseAppInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return firebaseAppInstance;
}

export function getFirebaseAuth() {
  if (!firebaseAuthInstance) {
    try {
      firebaseAuthInstance = getAuth(getFirebaseApp());
    } catch (err) {
      console.warn('[Firebase Auth Init Warning]:', err);
    }
  }
  return firebaseAuthInstance;
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
 * Firebase Authentication Service for MediAI
 * Manages clinician and patient authentication.
 */
export class FirebaseAuthService {
  public static async signUp(email: string, pass: string): Promise<User | null> {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    return cred.user;
  }

  public static async signIn(email: string, pass: string): Promise<User | null> {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return cred.user;
  }

  public static async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  }

  public static getCurrentUser(): User | null {
    const auth = getFirebaseAuth();
    return auth ? auth.currentUser : null;
  }

  public static onAuthStateChange(callback: (user: User | null) => void) {
    const auth = getFirebaseAuth();
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  }
}

/**
 * Cloud Firestore Service for MediAI Data Management
 * Handles patient profiles, medical history, assessments, risk predictions, triage records, and medication information.
 */
export class FirestoreService {
  // 1. Save & Get Patient Profile
  public static async savePatientProfile(patientId: string, profileData: any): Promise<void> {
    try {
      const db = getFirebaseDb();
      if (!db) return;
      const patientRef = doc(db, 'patient_profiles', patientId);
      await setDoc(
        patientRef,
        {
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('[Firestore] Error saving patient profile:', error);
    }
  }

  public static async getPatientProfile(patientId: string): Promise<any | null> {
    try {
      const db = getFirebaseDb();
      if (!db) return null;
      const patientRef = doc(db, 'patient_profiles', patientId);
      const snap = await getDoc(patientRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      console.warn('[Firestore] Error fetching patient profile:', error);
      return null;
    }
  }

  // 2. Save & Get Medical History
  public static async saveMedicalHistory(patientId: string, historyData: any): Promise<string> {
    try {
      const db = getFirebaseDb();
      if (!db) return `hist_${Date.now()}`;
      const historyRef = collection(db, 'medical_histories');
      const docRef = await addDoc(historyRef, {
        patient_id: patientId,
        ...historyData,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.warn('[Firestore] Error saving medical history:', error);
      return `hist_${Date.now()}`;
    }
  }

  public static async getMedicalHistory(patientId: string): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      if (!db) return [];
      const historyRef = collection(db, 'medical_histories');
      const q = query(historyRef, where('patient_id', '==', patientId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('[Firestore] Error fetching medical history:', error);
      return [];
    }
  }

  // 3. Save & Get Triage Assessments
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
      return `doc_${Date.now()}`;
    }
  }

  public static async getTriageAssessments(patientId?: string): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      if (!db) return [];
      const assessmentsRef = collection(db, 'triage_assessments');
      const q = patientId
        ? query(assessmentsRef, where('patient_id', '==', patientId))
        : query(assessmentsRef);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('[Firestore] Error fetching triage assessments:', error);
      return [];
    }
  }

  // 4. Save & Get Risk Predictions
  public static async saveRiskPrediction(patientId: string, predictionData: any): Promise<string> {
    try {
      const db = getFirebaseDb();
      if (!db) return `pred_${Date.now()}`;
      const predRef = collection(db, 'risk_predictions');
      const docRef = await addDoc(predRef, {
        patient_id: patientId,
        ...predictionData,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.warn('[Firestore] Error saving risk prediction:', error);
      return `pred_${Date.now()}`;
    }
  }

  public static async getRiskPredictions(patientId?: string): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      if (!db) return [];
      const predRef = collection(db, 'risk_predictions');
      const q = patientId
        ? query(predRef, where('patient_id', '==', patientId))
        : query(predRef);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('[Firestore] Error fetching risk predictions:', error);
      return [];
    }
  }

  // 5. Save & Get Triage Records
  public static async saveTriageRecord(patientId: string, recordData: any): Promise<string> {
    try {
      const db = getFirebaseDb();
      if (!db) return `rec_${Date.now()}`;
      const recordRef = collection(db, 'triage_records');
      const docRef = await addDoc(recordRef, {
        patient_id: patientId,
        ...recordData,
        created_at: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.warn('[Firestore] Error saving triage record:', error);
      return `rec_${Date.now()}`;
    }
  }

  public static async getTriageRecords(patientId?: string): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      if (!db) return [];
      const recordRef = collection(db, 'triage_records');
      const q = patientId
        ? query(recordRef, where('patient_id', '==', patientId))
        : query(recordRef);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('[Firestore] Error fetching triage records:', error);
      return [];
    }
  }

  // 6. Save & Get Medication Information
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

  public static async getMedicationRecords(patientId: string): Promise<any[]> {
    try {
      const db = getFirebaseDb();
      if (!db) return [];
      const medRef = collection(db, 'patient_medications');
      const q = query(medRef, where('patient_id', '==', patientId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('[Firestore] Error fetching medication records:', error);
      return [];
    }
  }
}

