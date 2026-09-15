import { supabase } from "@/config/supabase";
import type {
  CreateComboComponentDTO,
  ProductComboComponent,
  UpdateComboComponentDTO,
} from "../types/combo";

function mapRow(row: ProductComboComponent): ProductComboComponent {
  return {
    ...row,
    quantity: Number(row.quantity ?? 1),
    sort_order: Number(row.sort_order ?? 0),
    allow_configuration: Boolean(row.allow_configuration),
    active: row.active !== false,
  };
}

export async function listComboComponents(comboProductId: string) {
  const { data, error } = await supabase
    .from("product_combo_components")
    .select(
      `
      *,
      component_product:products!product_combo_components_component_product_id_fkey (
        id, name, price, status, stock, image_url
      )
    `
    )
    .eq("combo_product_id", comboProductId)
    .order("sort_order", { ascending: true });

  if (error) {
    // Table may not exist until migration 026 is applied
    if (error.code === "42P01" || /does not exist/i.test(error.message)) {
      return [] as ProductComboComponent[];
    }
    throw error;
  }

  return ((data ?? []) as ProductComboComponent[]).map(mapRow);
}

export async function createComboComponent(payload: CreateComboComponentDTO) {
  const { data, error } = await supabase
    .from("product_combo_components")
    .insert({
      combo_product_id: payload.combo_product_id,
      component_product_id: payload.component_product_id,
      display_name: payload.display_name ?? null,
      quantity: payload.quantity ?? 1,
      sort_order: payload.sort_order ?? 0,
      allow_configuration: payload.allow_configuration ?? true,
      active: payload.active ?? true,
    })
    .select(
      `
      *,
      component_product:products!product_combo_components_component_product_id_fkey (
        id, name, price, status, stock, image_url
      )
    `
    )
    .single();

  if (error) throw error;
  return mapRow(data as ProductComboComponent);
}

export async function updateComboComponent(
  id: string,
  payload: UpdateComboComponentDTO
) {
  const { data, error } = await supabase
    .from("product_combo_components")
    .update(payload)
    .eq("id", id)
    .select(
      `
      *,
      component_product:products!product_combo_components_component_product_id_fkey (
        id, name, price, status, stock, image_url
      )
    `
    )
    .single();

  if (error) throw error;
  return mapRow(data as ProductComboComponent);
}

export async function deleteComboComponent(id: string) {
  const { error } = await supabase
    .from("product_combo_components")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function reorderComboComponents(
  comboProductId: string,
  orderedIds: string[]
) {
  // Two-phase sort_order to satisfy unique (combo_product_id, sort_order)
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from("product_combo_components")
      .update({ sort_order: -(i + 1) })
      .eq("id", orderedIds[i])
      .eq("combo_product_id", comboProductId);
    if (error) throw error;
  }
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from("product_combo_components")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("combo_product_id", comboProductId);
    if (error) throw error;
  }
}

/** Conta sale_items ligados ao slot (impacto antes de remover). */
export async function countSaleItemsForComboComponent(componentId: string) {
  const { count, error } = await supabase
    .from("sale_items")
    .select("id", { count: "exact", head: true })
    .eq("combo_component_id", componentId);

  if (error) {
    // Coluna pode não existir em ambientes sem 026 — trate como zero
    if (error.code === "42703" || /combo_component_id/i.test(error.message)) {
      return 0;
    }
    throw error;
  }

  return count ?? 0;
}
