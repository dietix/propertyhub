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
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Transaction, TransactionType } from "../types";

const COLLECTION_NAME = "transactions";

// Cache local para transações
let transactionsCache: Transaction[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 segundos

function isCacheValid(): boolean {
  return (
    transactionsCache !== null && Date.now() - cacheTimestamp < CACHE_DURATION
  );
}

export function invalidateTransactionsCache(): void {
  transactionsCache = null;
  cacheTimestamp = 0;
}

export async function getTransactions(): Promise<Transaction[]> {
  // Retorna cache se válido
  if (isCacheValid()) {
    return transactionsCache!;
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("date", "desc"),
    limit(500), // Limita para evitar carregar muitos documentos
  );
  const snapshot = await getDocs(q);

  const transactions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Transaction[];

  // Atualiza o cache
  transactionsCache = transactions;
  cacheTimestamp = Date.now();

  return transactions;
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  // Tenta buscar do cache primeiro
  if (isCacheValid()) {
    const cached = transactionsCache!.find((t) => t.id === id);
    if (cached) return cached;
  }

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
  // Usa cache se disponível
  if (isCacheValid()) {
    return transactionsCache!.filter((t) => t.propertyId === propertyId);
  }

  // Carrega todas as transações no cache e filtra
  const allTransactions = await getTransactions();
  return allTransactions.filter((t) => t.propertyId === propertyId);
}

export async function getTransactionsByType(
  type: TransactionType,
): Promise<Transaction[]> {
  // Usa cache se disponível
  if (isCacheValid()) {
    return transactionsCache!.filter((t) => t.type === type);
  }

  // Carrega todas as transações no cache e filtra
  const allTransactions = await getTransactions();
  return allTransactions.filter((t) => t.type === type);
}

export async function getTransactionsByDateRange(
  start: Date,
  end: Date,
): Promise<Transaction[]> {
  // Usa cache se disponível
  if (isCacheValid()) {
    return transactionsCache!.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }

  // Carrega todas as transações no cache e filtra
  const allTransactions = await getTransactions();
  return allTransactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= start && transactionDate <= end;
  });
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

  invalidateTransactionsCache();
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
  invalidateTransactionsCache();
}

export async function deleteTransaction(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
  invalidateTransactionsCache();
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
