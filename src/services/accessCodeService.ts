import { supabase } from "../config/supabase";
import { AccessCode } from "../types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

function mapDbToAccessCode(data: Record<string, unknown>): AccessCode {
  return {
    id: data.id as string,
    propertyId: data.property_id as string,
    code: data.code as string,
    description: (data.description as string) || "",
    startDate: parseDateOnly(data.start_date as string),
    endDate: parseDateOnly(data.end_date as string),
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

export async function getAccessCodes(): Promise<AccessCode[]> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("*")
    .order("end_date", { ascending: false });

  if (error) {
    console.error("Error fetching access codes:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToAccessCode);
}

export async function getAccessCodesByProperty(
  propertyId: string,
): Promise<AccessCode[]> {
  const { data, error } = await supabase
    .from("access_codes")
    .select("*")
    .eq("property_id", propertyId)
    .order("end_date", { ascending: false });

  if (error) {
    console.error("Error fetching access codes by property:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToAccessCode);
}

export async function createAccessCode(
  accessCode: Omit<AccessCode, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const { data, error } = await supabase
    .from("access_codes")
    .insert({
      property_id: accessCode.propertyId,
      code: accessCode.code,
      description: accessCode.description,
      start_date: formatDateOnly(accessCode.startDate),
      end_date: formatDateOnly(accessCode.endDate),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating access code:", error);
    throw new Error(error.message);
  }

  return data.id;
}

export async function updateAccessCode(
  id: string,
  accessCode: Partial<Omit<AccessCode, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (accessCode.propertyId) updateData.property_id = accessCode.propertyId;
  if (accessCode.code) updateData.code = accessCode.code;
  if (accessCode.description !== undefined)
    updateData.description = accessCode.description;
  if (accessCode.startDate)
    updateData.start_date = formatDateOnly(accessCode.startDate);
  if (accessCode.endDate)
    updateData.end_date = formatDateOnly(accessCode.endDate);

  const { error } = await supabase
    .from("access_codes")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating access code:", error);
    throw new Error(error.message);
  }
}

export async function deleteAccessCode(id: string): Promise<void> {
  const { error } = await supabase.from("access_codes").delete().eq("id", id);

  if (error) {
    console.error("Error deleting access code:", error);
    throw new Error(error.message);
  }
}
