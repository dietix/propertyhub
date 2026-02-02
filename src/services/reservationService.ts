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
import { Reservation, ReservationStatus } from "../types";

const COLLECTION_NAME = "reservations";

export async function getReservations(): Promise<Reservation[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("checkIn", "desc"));
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

export async function getReservationById(
  id: string,
): Promise<Reservation | null> {
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
  const q = query(
    collection(db, COLLECTION_NAME),
    where("propertyId", "==", propertyId),
    orderBy("checkIn", "desc"),
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
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const q = query(
    collection(db, COLLECTION_NAME),
    where("checkIn", ">=", Timestamp.fromDate(now)),
    where("checkIn", "<=", Timestamp.fromDate(futureDate)),
    where("status", "in", ["pending", "confirmed"]),
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
}

export async function deleteReservation(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
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
