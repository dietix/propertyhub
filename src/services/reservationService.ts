import { supabase } from "../config/supabase";
import { Reservation, ReservationStatus } from "../types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

function mapDbToReservation(data: Record<string, unknown>): Reservation {
  return {
    id: data.id as string,
    propertyId: data.property_id as string,
    guestName: data.guest_name as string,
    guestEmail: data.guest_email as string,
    guestPhone: (data.guest_phone as string) || "",
    checkIn: parseDateOnly(data.check_in as string),
    checkOut: parseDateOnly(data.check_out as string),
    numberOfGuests: data.number_of_guests as number,
    totalAmount: Number(data.total_amount),
    cleaningFee: Number(data.cleaning_fee) || 0,
    platformFee: Number(data.platform_fee) || 0,
    status: data.status as ReservationStatus,
    source: data.source as Reservation["source"],
    notes: (data.notes as string) || "",
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("check_in", { ascending: false });

  if (error) {
    console.error("Error fetching reservations:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToReservation);
}

export async function getReservationById(
  id: string,
): Promise<Reservation | null> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching reservation:", error);
    throw new Error(error.message);
  }

  return data ? mapDbToReservation(data) : null;
}

export async function getReservationsByProperty(
  propertyId: string,
): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("property_id", propertyId)
    .order("check_in", { ascending: false });

  if (error) {
    console.error("Error fetching reservations by property:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToReservation);
}

export async function getUpcomingReservations(
  daysAhead: number = 7,
): Promise<Reservation[]> {
  const now = formatDateOnly(new Date());
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = formatDateOnly(futureDate);

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .gte("check_in", now)
    .lte("check_in", futureDateStr)
    .in("status", ["pending", "confirmed"])
    .order("check_in");

  if (error) {
    console.error("Error fetching upcoming reservations:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToReservation);
}

export async function createReservation(
  reservation: Omit<Reservation, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      property_id: reservation.propertyId,
      guest_name: reservation.guestName,
      guest_email: reservation.guestEmail,
      guest_phone: reservation.guestPhone,
      check_in: formatDateOnly(reservation.checkIn),
      check_out: formatDateOnly(reservation.checkOut),
      number_of_guests: reservation.numberOfGuests,
      total_amount: reservation.totalAmount,
      cleaning_fee: reservation.cleaningFee,
      platform_fee: reservation.platformFee,
      status: reservation.status,
      source: reservation.source,
      notes: reservation.notes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating reservation:", error);
    throw new Error(error.message);
  }

  return data.id;
}

export async function updateReservation(
  id: string,
  reservation: Partial<Reservation>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (reservation.propertyId !== undefined)
    updateData.property_id = reservation.propertyId;
  if (reservation.guestName !== undefined)
    updateData.guest_name = reservation.guestName;
  if (reservation.guestEmail !== undefined)
    updateData.guest_email = reservation.guestEmail;
  if (reservation.guestPhone !== undefined)
    updateData.guest_phone = reservation.guestPhone;
  if (reservation.checkIn !== undefined)
    updateData.check_in = formatDateOnly(reservation.checkIn);
  if (reservation.checkOut !== undefined)
    updateData.check_out = formatDateOnly(reservation.checkOut);
  if (reservation.numberOfGuests !== undefined)
    updateData.number_of_guests = reservation.numberOfGuests;
  if (reservation.totalAmount !== undefined)
    updateData.total_amount = reservation.totalAmount;
  if (reservation.cleaningFee !== undefined)
    updateData.cleaning_fee = reservation.cleaningFee;
  if (reservation.platformFee !== undefined)
    updateData.platform_fee = reservation.platformFee;
  if (reservation.status !== undefined) updateData.status = reservation.status;
  if (reservation.source !== undefined) updateData.source = reservation.source;
  if (reservation.notes !== undefined) updateData.notes = reservation.notes;

  const { error } = await supabase
    .from("reservations")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating reservation:", error);
    throw new Error(error.message);
  }
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Error updating reservation status:", error);
    throw new Error(error.message);
  }
}

export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from("reservations").delete().eq("id", id);

  if (error) {
    console.error("Error deleting reservation:", error);
    throw new Error(error.message);
  }
}

export async function getReservationsByDateRange(
  start: Date,
  end: Date,
): Promise<Reservation[]> {
  const startStr = formatDateOnly(start);
  const endStr = formatDateOnly(end);

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .gte("check_in", startStr)
    .lte("check_in", endStr)
    .order("check_in");

  if (error) {
    console.error("Error fetching reservations by date range:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToReservation);
}
