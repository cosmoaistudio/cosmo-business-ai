import { supabase } from "@/config/supabase";
import type { Product } from "../types/product";
import { resolveProductImage } from "../utils/productImage";

function normalizeProduct(product: Product): Product {
  const imageUrl = resolveProductImage(product);

  return {
    ...product,
    min_stock: product.min_stock ?? 0,
    category: product.category ?? "",
    description: product.description ?? "",
    image_url: imageUrl || null,
    image: imageUrl || undefined,
  };
}

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as Product[]).map(normalizeProduct);
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return normalizeProduct(data as Product);
}

export type CreateProductDTO = Omit<
  Product,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

export async function createProduct(product: CreateProductDTO) {
  const { id, ...payload } = product;

  const row: Record<string, unknown> = { ...payload };
  if (id) row.id = id;

  const { data, error } = await supabase
    .from("products")
    .insert(row)
    .select()
    .single();

  // Pre-migration 026: menu_kind column may not exist yet
  if (
    error &&
    product.menu_kind &&
    (/menu_kind/i.test(error.message) || error.code === "PGRST204")
  ) {
    const { menu_kind: _ignored, ...rest } = payload;
    const fallback: Record<string, unknown> = { ...rest };
    if (id) fallback.id = id;
    const retry = await supabase.from("products").insert(fallback).select().single();
    if (retry.error) throw retry.error;
    return retry.data as Product;
  }

  if (error) throw error;

  return data as Product;
}

export async function updateProduct(
  id: string,
  product: Partial<CreateProductDTO>
) {
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}