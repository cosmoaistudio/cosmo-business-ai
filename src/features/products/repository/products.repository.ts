import { supabase } from "@/config/supabase";
import type { Product } from "../types/product";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as Product[];
}

export type CreateProductDTO = Omit<
  Product,
  "id" | "created_at" | "updated_at"
>;

export async function createProduct(product: CreateProductDTO) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Product;
}