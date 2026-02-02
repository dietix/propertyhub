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
import { Reservation, ReservationStatus } from "../types";

const COLLECTION_NAME = "reservations";

// Cache local para reservas
let reservationsCache: Reservation[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 segundos

export async function getReservations(
  forceRefresh = false,
): Promise<Reservation[]> {
  // Usar cache se disponível e não expirado
  if (
    !forceRefresh &&
    reservationsCache &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    return reservationsCache;
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("checkIn", "desc"),
    limit(200), // Limitar resultados
  );
  const snapshot = await getDocs(q);

  reservationsCache = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    checkIn: doc.data().checkIn?.toDate?.() || new Date(),
    checkOut: doc.data().checkOut?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Reservation[];

  cacheTimestamp = Date.now();
  return reservationsCache;
}

// Invalida o cache quando necessário
export function invalidateReservationsCache() {
  reservationsCache = null;
  cacheTimestamp = 0;
}

export async function getReservationById(
  id: string,
): Promise<Reservation | null> {
  // Primeiro verifica no cache
  if (reservationsCache) {
    const cached = reservationsCache.find((r) => r.id === id);
    if (cached) return cached;
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    checkIn: data.checkIn?.toDate?.() || new Date(),
    checkOut: data.checkOut?.toDate?.() || new Date(),
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  } as Reservation;
}

export async function getReservationsByProperty(
  propertyId: string,
): Promise<Reservation[]> {
  // Usar cache se disponível
  if (reservationsCache) {
    return reservationsCache.filter((r) => r.propertyId === propertyId);
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where("propertyId", "==", propertyId),
    orderBy("checkIn", "desc"),
    limit(100),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    checkIn: doc.data().checkIn?.toDate?.() || new Date(),
    checkOut: doc.data().checkOut?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Reservation[];
}

export async function getUpcomingReservations(
  daysAhead: number = 7,
): Promise<Reservation[]> {
  // Usar cache se disponível
  if (reservationsCache) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return reservationsCache.filter((r) => {
      const checkIn = new Date(r.checkIn);
      return (
        checkIn >= now &&
        checkIn <= futureDate &&
        (r.status === "pending" || r.status === "confirmed")
      );
    });
  }

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const q = query(
    collection(db, COLLECTION_NAME),
    where("checkIn", ">=", Timestamp.fromDate(now)),
    where("checkIn", "<=", Timestamp.fromDate(futureDate)),
    orderBy("checkIn"),
    limit(50),
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    checkIn: doc.data().checkIn?.toDate?.() || new Date(),
    checkOut: doc.data().checkOut?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Reservation[];

  // Filtrar por status no cliente (evita índice composto com "in")
  return results.filter(
    (r) => r.status === "pending" || r.status === "confirmed",
  );
}

export async function createReservation(
  reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...reservation,
    checkIn: Timestamp.fromDate(new Date(reservation.checkIn)),
    checkOut: Timestamp.fromDate(new Date(reservation.checkOut)),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  invalidateReservationsCache();
  return docRef.id;
}

export async function updateReservation(
  id: string,
  reservation: Partial<Reservation>,
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData: Record<string, unknown> = {
    ...reservation,
    updatedAt: Timestamp.now(),
  };

  if (reservation.checkIn) {
    updateData.checkIn = Timestamp.fromDate(new Date(reservation.checkIn));
  }
  if (reservation.checkOut) {
    updateData.checkOut = Timestamp.fromDate(new Date(reservation.checkOut));
  }

  await updateDoc(docRef, updateData);
  invalidateReservationsCache();
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
  });
  invalidateReservationsCache();
}

export async function deleteReservation(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
  invalidateReservationsCache();
}

export async function getReservationsByDateRange(
  start: Date,
  end: Date,
): Promise<Reservation[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("checkIn", ">=", Timestamp.fromDate(start)),
    where("checkIn", "<=", Timestamp.fromDate(end)),
    orderBy("checkIn"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    checkIn: doc.data().checkIn?.toDate?.() || new Date(),
    checkOut: doc.data().checkOut?.toDate?.() || new Date(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  })) as Reservation[];
}
