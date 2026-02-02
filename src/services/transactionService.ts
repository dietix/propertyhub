import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Transaction, TransactionType } from "../types";

const COLLECTION_NAME = "transactions";

export async function getTransactions(): Promise<Transaction[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Transaction[];
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: data.date?.toDate?.() || new Date(),
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Transaction;
}

export async function getTransactionsByProperty(
  propertyId: string,
): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("propertyId", "==", propertyId),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Transaction[];
}

export async function getTransactionsByType(
  type: TransactionType,
): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("type", "==", type),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Transaction[];
}

export async function getTransactionsByDateRange(
  start: Date,
  end: Date,
): Promise<Transaction[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<=", Timestamp.fromDate(end)),
    orderBy("date", "desc"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Transaction[];
}

export async function createTransaction(
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...transaction,
    date: Timestamp.fromDate(new Date(transaction.date)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateTransaction(
  id: string,
  transaction: Partial<Transaction>,
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData: Record<string, unknown> = {
    ...transaction,
    updatedAt: Timestamp.now(),
  };

  if (transaction.date) {
    updateData.date = Timestamp.fromDate(new Date(transaction.date));
  }

  await updateDoc(docRef, updateData);
}

export async function deleteTransaction(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

// Financial summary helpers
export async function getMonthlyTransactions(
  year: number,
  month: number,
): Promise<Transaction[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  return getTransactionsByDateRange(start, end);
}

export async function getYearlyTransactions(
  year: number,
): Promise<Transaction[]> {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  return getTransactionsByDateRange(start, end);
}
