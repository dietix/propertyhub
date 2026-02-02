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
import { Property } from "../types";

const COLLECTION_NAME = "properties";

// Cache local para evitar múltiplas requisições
let propertiesCache: Property[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 segundos

export async function getProperties(forceRefresh = false): Promise<Property[]> {
  // Usar cache se disponível e não expirado
  if (
    !forceRefresh &&
    propertiesCache &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    return propertiesCache;
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc"),
    limit(100), // Limitar resultados
  );
  const snapshot = await getDocs(q);

  propertiesCache = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Property[];

  cacheTimestamp = Date.now();
  return propertiesCache;
}

// Invalida o cache quando necessário
export function invalidatePropertiesCache() {
  propertiesCache = null;
  cacheTimestamp = 0;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  // Primeiro, verifica no cache
  if (propertiesCache) {
    const cached = propertiesCache.find((p) => p.id === id);
    if (cached) return cached;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Property;
}

export async function createProperty(
  property: Omit<Property, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...property,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  invalidatePropertiesCache(); // Invalida cache após criação
  return docRef.id;
}

export async function updateProperty(
  id: string,
  property: Partial<Property>,
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...property,
    updatedAt: Timestamp.now(),
  });
  invalidatePropertiesCache(); // Invalida cache após atualização
}

export async function deleteProperty(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
  invalidatePropertiesCache(); // Invalida cache após exclusão
}

export async function getActiveProperties(): Promise<Property[]> {
  // Usar cache se disponível
  if (propertiesCache) {
    return propertiesCache.filter((p) => p.isActive);
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where("isActive", "==", true),
    orderBy("name"),
    limit(100),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Property[];
}
