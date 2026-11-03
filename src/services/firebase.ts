import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppAccount, DailyReportData, AuditLog } from '../types/reporting';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with Database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate Connection to Firestore on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    console.warn('Firebase connection check:', error);
    return false;
  }
}

// Error Handling Enum & Interface according to skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Bootstrapped Admin List
export const ADMIN_EMAILS = [
  'updatetokendanswacam@gmail.com',
  'muhamadjunaedi057@gmail.com',
];

export function isEmailAdmin(email: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    ADMIN_EMAILS.includes(clean) ||
    clean.includes('admin.depotel') ||
    clean.startsWith('admin@')
  );
}

// Real-time Firestore Listeners
export function subscribeToDailyReport(
  reportId: string,
  onData: (data: DailyReportData | null) => void,
  onError?: (err: any) => void
) {
  const reportRef = doc(db, 'dailyReports', reportId);
  return onSnapshot(
    reportRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as DailyReportData);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn(`Firestore onSnapshot report error (${reportId}):`, err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToUsers(
  onUsers: (users: AppAccount[]) => void,
  onError?: (err: any) => void
) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const userList: AppAccount[] = [];
      snapshot.forEach((d) => {
        userList.push(d.data() as AppAccount);
      });
      onUsers(userList);
    },
    (err) => {
      console.warn('Firestore onSnapshot users error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToAuditLogs(
  onLogs: (logs: AuditLog[]) => void,
  onError?: (err: any) => void
) {
  const logsRef = collection(db, 'auditLogs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const logList: AuditLog[] = [];
      snapshot.forEach((d) => {
        logList.push({ id: d.id, ...d.data() } as AuditLog);
      });
      onLogs(logList);
    },
    (err) => {
      console.warn('Firestore onSnapshot auditLogs error:', err);
      if (onError) onError(err);
    }
  );
}

// Firestore Mutations
export async function saveDailyReportToFirestore(report: DailyReportData): Promise<void> {
  const pathForWrite = `dailyReports/${report.id}`;
  try {
    const reportRef = doc(db, 'dailyReports', report.id);
    await setDoc(reportRef, {
      ...report,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: auth.currentUser?.email || 'Anonymous',
    });
  } catch (err) {
    console.warn(`Firestore saveDailyReportToFirestore warning (${report.id}):`, err);
  }
}

export async function saveUserToFirestore(userAcc: AppAccount): Promise<void> {
  const pathForWrite = `users/${userAcc.id}`;
  try {
    const userRef = doc(db, 'users', userAcc.id);
    await setDoc(userRef, {
      ...userAcc,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });

    // If admin, also write reference in /admins collection
    if (userAcc.role === 'ROLE_ADMIN' && userAcc.uid) {
      await setDoc(doc(db, 'admins', userAcc.uid), {
        uid: userAcc.uid,
        email: userAcc.email,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (err) {
    console.warn(`Firestore saveUserToFirestore warning (${userAcc.id}):`, err);
  }
}

export async function logAuditActivity(
  action: string,
  details: string,
  userEmail?: string,
  userName?: string,
  userRole?: string
): Promise<void> {
  const pathForWrite = 'auditLogs';
  try {
    const logsRef = collection(db, 'auditLogs');
    await addDoc(logsRef, {
      userEmail: userEmail || auth.currentUser?.email || 'System',
      userName: userName || auth.currentUser?.displayName || 'System User',
      userRole: userRole || 'USER',
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Log audit activity non-fatal error:', err);
  }
}

// Google Authentication Popup Flow
export async function signInWithGooglePopup(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-In Popup Error:', err);
    throw err;
  }
}

export async function logOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}
