import { supabase } from "@/config/supabase";
import type { Product } from "../types/product";
import {
  isMissingDigitalPromoColumnError,
  normalizeProduct,
  stripDigitalPromoColumns,
  toProductWriteRow,
  type ProductRow,
  type ProductWriteDTO,
} from "../utils/normalizeProduct";

export type CreateProductDTO = Omit<
  Product,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};

function isMissingMenuKindError(error: { message?: string; code?: string }) {
  return /menu_kind/i.test(error.message ?? "");
}

async function insertProduct(row: Record<string, unknown>) {
  let result = await supabase.from("products").insert(row).select().single();

  if (
    result.error &&
    isMissingDigitalPromoColumnError(result.error) &&
    ("promotional_price" in row || "featured" in row)
  ) {
    const stripped = stripDigitalPromoColumns(row);
    result = await supabase.from("products").insert(stripped).select().single();
    row = stripped;
  }

  if (result.error && isMissingMenuKindError(result.error) && row.menu_kind) {
    const { menu_kind: _ignored, ...rest } = row;
    result = await supabase.from("products").insert(rest).select().single();
  }

  if (result.error) throw result.error;
  return normalizeProduct(result.data as ProductRow);
}

async function updateProductRow(id: string, row: Record<string, unknown>) {
  let result = await supabase
    .from("products")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (
    result.error &&
    isMissingDigitalPromoColumnError(result.error) &&
    ("promotional_price" in row || "featured" in row)
  ) {
    const stripped = stripDigitalPromoColumns(row);
    result = await supabase
      .from("products")
      .update(stripped)
      .eq("id", id)
      .select()
      .single();
    row = stripped;
  }

  if (result.error && isMissingMenuKindError(result.error) && row.menu_kind) {
    const { menu_kind: _ignored, ...rest } = row;
    result = await supabase
      .from("products")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
  }

  if (result.error) throw result.error;
  return normalizeProduct(result.data as ProductRow);
}

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data as ProductRow[]).map(normalizeProduct);
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return normalizeProduct(data as ProductRow);
}

export async function createProduct(product: CreateProductDTO) {
  const { id, ...payload } = product;
  const row = toProductWriteRow(payload as ProductWriteDTO);
  if (id) row.id = id;
  return insertProduct(row);
}

export async function updateProduct(
  id: string,
  product: Partial<CreateProductDTO>
) {
  const row = toProductWriteRow(product as ProductWriteDTO);
  return updateProductRow(id, row);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;
}
