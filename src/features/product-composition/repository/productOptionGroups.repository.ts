import { supabase } from "@/config/supabase";
import type {
  CreateProductOptionGroupDTO,
  ProductOptionGroup,
  ProductOptionGroupWithGroup,
  UpdateProductOptionGroupDTO,
} from "../types/productOptionGroup";

function mapProductOptionGroup(row: ProductOptionGroup): ProductOptionGroup {
  return {
    ...row,
    sort_order: Number(row.sort_order ?? 0),
  };
}

export async function getProductOptionGroupsByProductId(productId: string) {
  const { data, error } = await supabase
    .from("product_option_groups")
    .select(
      `
      *,
      option_groups (*)
    `
    )
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data as ProductOptionGroupWithGroup[]).map((row) => ({
    ...mapProductOptionGroup(row),
    option_groups: row.option_groups ?? null,
  }));
}

export async function getProductOptionGroupById(id: string) {
  const { data, error } = await supabase
    .from("product_option_groups")
    .select(
      `
      *,
      option_groups (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  const row = data as ProductOptionGroupWithGroup;

  return {
    ...mapProductOptionGroup(row),
    option_groups: row.option_groups ?? null,
  };
}

export async function createProductOptionGroup(
  payload: CreateProductOptionGroupDTO
) {
  const { data, error } = await supabase
    .from("product_option_groups")
    .insert(payload)
    .select(
      `
      *,
      option_groups (*)
    `
    )
    .single();

  if (error) throw error;

  const row = data as ProductOptionGroupWithGroup;

  return {
    ...mapProductOptionGroup(row),
    option_groups: row.option_groups ?? null,
  };
}

export async function updateProductOptionGroup(
  id: string,
  payload: UpdateProductOptionGroupDTO
) {
  const { data, error } = await supabase
    .from("product_option_groups")
    .update(payload)
    .eq("id", id)
    .select(
      `
      *,
      option_groups (*)
    `
    )
    .single();

  if (error) throw error;

  const row = data as ProductOptionGroupWithGroup;

  return {
    ...mapProductOptionGroup(row),
    option_groups: row.option_groups ?? null,
  };
}

export async function deleteProductOptionGroup(id: string) {
  const { error } = await supabase
    .from("product_option_groups")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteProductOptionGroupsByProductId(productId: string) {
  const { error } = await supabase
    .from("product_option_groups")
    .delete()
    .eq("product_id", productId);

  if (error) throw error;
}

/** One query: product_id → number of linked option groups (for menu kind filters). */
export async function getCompositionGroupCountsByProductIds(
  productIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (productIds.length === 0) return counts;

  const { data, error } = await supabase
    .from("product_option_groups")
    .select("product_id")
    .in("product_id", productIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const id = row.product_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return counts;
}

/** How many products reuse a shared option group. */
export async function getProductCountByGroupId(groupId: string): Promise<{
  productCount: number;
  products: Array<{ id: string; name: string }>;
}> {
  const { data, error } = await supabase
    .from("product_option_groups")
    .select("product_id, products(id, name)")
    .eq("group_id", groupId);

  if (error) throw error;

  const products = (data ?? [])
    .map((row) => {
      const product = row.products as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      if (!product) return null;
      if (Array.isArray(product)) return product[0] ?? null;
      return product;
    })
    .filter((row): row is { id: string; name: string } => Boolean(row));

  const unique = Array.from(new Map(products.map((p) => [p.id, p])).values());

  return { productCount: unique.length, products: unique };
}

export type {
  CreateProductOptionGroupDTO,
  UpdateProductOptionGroupDTO,
} from "../types/productOptionGroup";
