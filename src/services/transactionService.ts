import { supabase } from "../config/supabase";
import { Transaction, TransactionType } from "../types";

function mapDbToTransaction(data: Record<string, unknown>): Transaction {
  return {
    id: data.id as string,
    propertyId: data.property_id as string,
    reservationId: (data.reservation_id as string) || undefined,
    type: data.type as TransactionType,
    category: data.category as Transaction["category"],
    amount: Number(data.amount),
    description: (data.description as string) || "",
    date: new Date(data.date as string),
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToTransaction);
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching transaction:", error);
    throw new Error(error.message);
  }

  return data ? mapDbToTransaction(data) : null;
}

export async function getTransactionsByProperty(
  propertyId: string,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("property_id", propertyId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions by property:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToTransaction);
}

export async function getTransactionsByType(
  type: TransactionType,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("type", type)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions by type:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToTransaction);
}

export async function getTransactionsByDateRange(
  start: Date,
  end: Date,
): Promise<Transaction[]> {
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions by date range:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToTransaction);
}

export async function createTransaction(
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      property_id: transaction.propertyId,
      reservation_id: transaction.reservationId || null,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split("T")[0],
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating transaction:", error);
    throw new Error(error.message);
  }

  return data.id;
}

export async function updateTransaction(
  id: string,
  transaction: Partial<Transaction>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (transaction.propertyId !== undefined)
    updateData.property_id = transaction.propertyId;
  if (transaction.reservationId !== undefined)
    updateData.reservation_id = transaction.reservationId || null;
  if (transaction.type !== undefined) updateData.type = transaction.type;
  if (transaction.category !== undefined)
    updateData.category = transaction.category;
  if (transaction.amount !== undefined) updateData.amount = transaction.amount;
  if (transaction.description !== undefined)
    updateData.description = transaction.description;
  if (transaction.date !== undefined)
    updateData.date = new Date(transaction.date).toISOString().split("T")[0];

  const { error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating transaction:", error);
    throw new Error(error.message);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting transaction:", error);
    throw new Error(error.message);
  }
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
