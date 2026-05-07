import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface GCRecord {
  id: string;
  name: string;
  platform: 'Telegram' | 'WhatsApp' | 'Discord';
  telegramChatId?: string;
  joinedCount: number;
  pitchCount: number;
  status?: 'Active' | 'Left' | 'Banned';
  createdAt: number;
  updatedAt: number;
}

export interface BestieRecord {
  id: string;
  realName: string;
  contactIdentity: string;
  status: 'Agreed' | 'Rejected' | 'Pending' | 'Sent Link';
  rejectionReason: string;
  gcId: string;
  uniqueId: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserStats {
  startDate: number;
  backgroundImage?: string;
  isClockStopped?: boolean;
  manualTimestamp?: number;
  consentLink?: string;
  createdAt: number;
  updatedAt: number;
}

export function subscribeToGCs(userId: string, callback: (gcs: GCRecord[]) => void) {
  const q = query(collection(db, `users/${userId}/gcs`), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GCRecord));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/gcs`);
  });
}

export function subscribeToBesties(userId: string, callback: (besties: BestieRecord[]) => void) {
  const q = query(collection(db, `users/${userId}/besties`), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BestieRecord));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/besties`);
  });
}

export function subscribeToStats(userId: string, callback: (stats: UserStats | null) => void) {
  const docRef = doc(db, `users/${userId}/stats/main`);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserStats);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/stats/main`);
  });
}

export async function addGC(userId: string, data: Omit<GCRecord, 'id' | 'createdAt' | 'updatedAt' | 'pitchCount' | 'joinedCount'>) {
    const id = crypto.randomUUID();
    const now = Date.now();
    try {
        await setDoc(doc(db, `users/${userId}/gcs/${id}`), {
            ...data,
            pitchCount: 0,
            joinedCount: 0,
            createdAt: now,
            updatedAt: now
        });
    } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/gcs`);
    }
}

export async function updateGC(userId: string, gcId: string, data: Partial<GCRecord>) {
    try {
        await updateDoc(doc(db, `users/${userId}/gcs/${gcId}`), {
            ...data,
            updatedAt: Date.now()
        });
    } catch(err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/gcs`);
    }
}

export async function addBestie(userId: string, data: Omit<BestieRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = crypto.randomUUID();
    const now = Date.now();
    try {
        await setDoc(doc(db, `users/${userId}/besties/${id}`), {
            ...data,
            createdAt: now,
            updatedAt: now
        });
    } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/besties`);
    }
}

export async function updateBestie(userId: string, bestieId: string, data: Partial<BestieRecord>) {
    try {
        await updateDoc(doc(db, `users/${userId}/besties/${bestieId}`), {
            ...data,
            updatedAt: Date.now()
        });
    } catch (err) {
         handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/besties`);
    }
}

export async function initStats(userId: string, startDateMs: number) {
    const now = Date.now();
    try {
        await setDoc(doc(db, `users/${userId}/stats/main`), {
            startDate: startDateMs,
            createdAt: now,
            updatedAt: now
        });
    } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/stats/main`);
    }
}

export async function updateStats(userId: string, data: Partial<UserStats>) {
    try {
        await updateDoc(doc(db, `users/${userId}/stats/main`), {
            ...data,
            updatedAt: Date.now()
        });
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/stats/main`);
    }
}


