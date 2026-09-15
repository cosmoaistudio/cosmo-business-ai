import { supabase } from "@/lib/supabase";
import {
  mapOptionGroupToEngine,
  mapOptionToEngine,
  mapProductToEngineNode,
} from "@/features/product-engine/adapters/compositionAdapter";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import type { Product } from "@/features/products/types/product";

export async function loadMobileEngineProductNode(
  productId: string
): Promise<EngineProductNode> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError) throw productError;

  const { data: links, error: linksError } = await supabase
    .from("product_option_groups")
    .select("*, option_groups(*)")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (linksError) throw linksError;

  const groups = [];
  const optionsByGroupId: EngineProductNode["optionsByGroupId"] = {};

  for (const link of links ?? []) {
    const groupMeta = link.option_groups;
    if (!groupMeta) continue;

    const { data: options, error: optionsError } = await supabase
      .from("options")
      .select("*")
      .eq("group_id", groupMeta.id)
      .order("sort_order", { ascending: true });

    if (optionsError) throw optionsError;

    const engineOptions = (options ?? []).map(mapOptionToEngine);
    optionsByGroupId[groupMeta.id] = engineOptions;
    groups.push(
      mapOptionGroupToEngine(
        groupMeta,
        engineOptions.map((option) => option.id)
      )
    );
  }

  return mapProductToEngineNode({
    product: product as Product,
    groups,
    optionsByGroupId,
  });
}
