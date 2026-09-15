import { supabase } from "@/config/supabase";
import { getProductById } from "@/features/products/repository/products.repository";
import { getOptionsByGroupId } from "@/features/product-composition/repository/options.repository";
import { getProductOptionGroupsByProductId } from "@/features/product-composition/repository/productOptionGroups.repository";
import {
  mapOptionGroupToEngine,
  mapOptionToEngine,
  mapProductToEngineNode,
} from "../adapters/compositionAdapter";
import type { EngineProductNode } from "../types/productEngine.types";

export async function loadEngineProductNode(productId: string): Promise<EngineProductNode> {
  const [product, links] = await Promise.all([
    getProductById(productId),
    getProductOptionGroupsByProductId(productId),
  ]);

  const groups = [];
  const optionsByGroupId: EngineProductNode["optionsByGroupId"] = {};

  for (const link of links) {
    const groupMeta = link.option_groups;
    if (!groupMeta) continue;

    const options = await getOptionsByGroupId(groupMeta.id);
    const engineOptions = options.map(mapOptionToEngine);
    optionsByGroupId[groupMeta.id] = engineOptions;
    groups.push(
      mapOptionGroupToEngine(
        groupMeta,
        engineOptions.map((option) => option.id)
      )
    );
  }

  return mapProductToEngineNode({
    product,
    groups,
    optionsByGroupId,
  });
}

export async function getProductIdsByGroupId(groupId: string) {
  const { data, error } = await supabase
    .from("product_option_groups")
    .select("product_id")
    .eq("group_id", groupId);

  if (error) throw error;

  return [...new Set((data ?? []).map((row) => row.product_id as string))];
}

export async function getProductIdsByOptionId(optionId: string) {
  const { data, error } = await supabase
    .from("options")
    .select("group_id")
    .eq("id", optionId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.group_id) return [];

  return getProductIdsByGroupId(data.group_id as string);
}

export async function loadAllActiveProductNodes(limit = 200): Promise<EngineProductNode[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("status", "active")
    .order("name")
    .limit(limit);

  if (error) throw error;

  const ids = (data ?? []).map((row) => row.id as string);
  return Promise.all(ids.map((id) => loadEngineProductNode(id)));
}
