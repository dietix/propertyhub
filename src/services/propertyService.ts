import { supabase } from "../config/supabase";
import { Property } from "../types";

function mapDbToProperty(data: Record<string, unknown>): Property {
  return {
    id: data.id as string,
    name: data.name as string,
    address: data.address as string,
    city: data.city as string,
    state: data.state as string,
    country: data.country as string,
    zipCode: data.zip_code as string,
    type: data.type as Property["type"],
    bedrooms: data.bedrooms as number,
    bathrooms: data.bathrooms as number,
    maxGuests: data.max_guests as number,
    amenities: (data.amenities as string[]) || [],
    description: (data.description as string) || "",
    basePrice: Number(data.base_price),
    cleaningFee: Number(data.cleaning_fee) || 0,
    images: (data.images as string[]) || [],
    isActive: data.is_active as boolean,
    ownerId: data.owner_id as string,
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
}

export async function getProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching properties:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToProperty);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching property:", error);
    throw new Error(error.message);
  }

  return data ? mapDbToProperty(data) : null;
}

export async function createProperty(
  property: Omit<Property, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const { data, error } = await supabase
    .from("properties")
    .insert({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      zip_code: property.zipCode,
      type: property.type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      max_guests: property.maxGuests,
      amenities: property.amenities,
      description: property.description,
      base_price: property.basePrice,
      cleaning_fee: property.cleaningFee,
      images: property.images,
      is_active: property.isActive,
      owner_id: property.ownerId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating property:", error);
    throw new Error(error.message);
  }

  return data.id;
}

export async function updateProperty(
  id: string,
  property: Partial<Property>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (property.name !== undefined) updateData.name = property.name;
  if (property.address !== undefined) updateData.address = property.address;
  if (property.city !== undefined) updateData.city = property.city;
  if (property.state !== undefined) updateData.state = property.state;
  if (property.country !== undefined) updateData.country = property.country;
  if (property.zipCode !== undefined) updateData.zip_code = property.zipCode;
  if (property.type !== undefined) updateData.type = property.type;
  if (property.bedrooms !== undefined) updateData.bedrooms = property.bedrooms;
  if (property.bathrooms !== undefined)
    updateData.bathrooms = property.bathrooms;
  if (property.maxGuests !== undefined)
    updateData.max_guests = property.maxGuests;
  if (property.amenities !== undefined)
    updateData.amenities = property.amenities;
  if (property.description !== undefined)
    updateData.description = property.description;
  if (property.basePrice !== undefined)
    updateData.base_price = property.basePrice;
  if (property.cleaningFee !== undefined)
    updateData.cleaning_fee = property.cleaningFee;
  if (property.images !== undefined) updateData.images = property.images;
  if (property.isActive !== undefined) updateData.is_active = property.isActive;
  if (property.ownerId !== undefined) updateData.owner_id = property.ownerId;

  const { error } = await supabase
    .from("properties")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating property:", error);
    throw new Error(error.message);
  }
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) {
    console.error("Error deleting property:", error);
    throw new Error(error.message);
  }
}

export async function getActiveProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching active properties:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToProperty);
}
