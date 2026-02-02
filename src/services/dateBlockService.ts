import { supabase } from "../config/supabase";
import { DateBlock } from "../types";

function mapDbToDateBlock(data: Record<string, unknown>): DateBlock {
  return {
    id: data.id as string,
    propertyId: data.property_id as string,
    startDate: new Date(data.start_date as string),
    endDate: new Date(data.end_date as string),
    reason: (data.reason as string) || "",
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

export async function getDateBlocks(): Promise<DateBlock[]> {
  const { data, error } = await supabase
    .from("date_blocks")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching date blocks:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToDateBlock);
}

export async function getDateBlocksByProperty(
  propertyId: string,
): Promise<DateBlock[]> {
  const { data, error } = await supabase
    .from("date_blocks")
    .select("*")
    .eq("property_id", propertyId)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching date blocks by property:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToDateBlock);
}

export async function createDateBlock(
  dateBlock: Omit<DateBlock, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const { data, error } = await supabase
    .from("date_blocks")
    .insert({
      property_id: dateBlock.propertyId,
      start_date: new Date(dateBlock.startDate).toISOString().split("T")[0],
      end_date: new Date(dateBlock.endDate).toISOString().split("T")[0],
      reason: dateBlock.reason,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating date block:", error);
    throw new Error(error.message);
  }

  return data.id;
}

export async function deleteDateBlock(id: string): Promise<void> {
  const { error } = await supabase.from("date_blocks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting date block:", error);
    throw new Error(error.message);
  }
}
