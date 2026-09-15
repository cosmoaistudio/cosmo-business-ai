import { supabase } from "@/config/supabase";
import type { ProductComboComponent } from "@/features/product-composition/types/combo";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import type { Product } from "@/features/products/types/product";

export interface PublicComboDefinition {
  product: Product;
  components: Array<
    ProductComboComponent & { engine_node?: EngineProductNode | null }
  >;
  nodeByProductId: Record<string, EngineProductNode>;
}

function mapEngineNode(raw: unknown): EngineProductNode | null {
  if (!raw || typeof raw !== "object") return null;
  const node = raw as EngineProductNode;
  if (!node.productId || !Array.isArray(node.groups)) return null;

  const optionsByGroupId: EngineProductNode["optionsByGroupId"] = {};
  const source = node.optionsByGroupId ?? {};
  for (const [groupId, options] of Object.entries(source)) {
    optionsByGroupId[groupId] = (options ?? []).map((option) => ({
      ...option,
      // Estoque não vem no RPC público; composer usa teto alto + stockControl do servidor na venda.
      stock: Number(
        (option as { stock?: number }).stock ??
          (option.stockControl ? 0 : 9999)
      ),
      price: Number(option.price ?? 0),
      stockControl: Boolean(option.stockControl),
      active: option.active !== false,
      premium: Boolean(option.premium),
      weight: Number(option.weight ?? 0),
      sortOrder: Number(option.sortOrder ?? 0),
      sku: null,
    }));
  }

  return {
    productId: node.productId,
    productName: node.productName,
    basePrice: Number(node.basePrice ?? 0),
    status: node.status === "inactive" ? "inactive" : "active",
    groups: node.groups.map((group) => ({
      ...group,
      minSelection: Number(group.minSelection ?? 0),
      maxSelection: Number(group.maxSelection ?? 1),
      maxFree: Number(group.maxFree ?? 0),
      allowsRepeat: Boolean(group.allowsRepeat),
      allowsQuantity: Boolean(group.allowsQuantity),
      hidden: Boolean(group.hidden),
      active: group.active !== false,
      required: Boolean(group.required),
      optionIds: (group.optionIds ?? []).map(String),
    })),
    optionsByGroupId,
  };
}

export async function fetchPublicComboDefinition(
  storeSlug: string,
  comboProductId: string
): Promise<PublicComboDefinition> {
  const { data, error } = await supabase.rpc("get_public_combo_definition", {
    p_store_slug: storeSlug,
    p_combo_product_id: comboProductId,
  });

  if (error) throw error;

  const payload = data as {
    product: {
      id: string;
      name: string;
      price: number;
      status: string;
      menu_kind: string;
      image_url?: string | null;
      combo_selection_mode?: string;
      combo_min_choices?: number | null;
      combo_max_choices?: number | null;
    };
    components: Array<Record<string, unknown>>;
  };

  const product: Product = {
    id: payload.product.id,
    name: payload.product.name,
    category: "",
    description: "",
    price: Number(payload.product.price),
    stock: 9999,
    min_stock: 0,
    image_url: payload.product.image_url ?? null,
    status: payload.product.status === "active" ? "active" : "inactive",
    menu_kind: "combo",
    combo_selection_mode:
      payload.product.combo_selection_mode === "choice" ? "choice" : "fixed",
    combo_min_choices: payload.product.combo_min_choices ?? null,
    combo_max_choices: payload.product.combo_max_choices ?? null,
    created_at: new Date().toISOString(),
  };

  const nodeByProductId: Record<string, EngineProductNode> = {};
  const components = (payload.components ?? []).map((row) => {
    const engineNode = mapEngineNode(row.engine_node);
    const componentProduct = row.component_product as
      | {
          id: string;
          name: string;
          price: number;
          status: string;
          image_url?: string | null;
          menu_kind?: string;
        }
      | undefined;

    if (engineNode) {
      nodeByProductId[engineNode.productId] = engineNode;
    }

    return {
      id: String(row.id),
      organization_id: "",
      combo_product_id: String(row.combo_product_id),
      component_product_id: String(row.component_product_id),
      display_name: (row.display_name as string | null) ?? null,
      quantity: Number(row.quantity ?? 1),
      sort_order: Number(row.sort_order ?? 0),
      allow_configuration: Boolean(row.allow_configuration),
      active: row.active !== false,
      created_at: new Date().toISOString(),
      component_product: componentProduct
        ? {
            id: componentProduct.id,
            name: componentProduct.name,
            price: Number(componentProduct.price),
            status: componentProduct.status as Product["status"],
            stock: 9999,
            image_url: componentProduct.image_url ?? null,
          }
        : null,
      engine_node: engineNode,
    };
  });

  return { product, components, nodeByProductId };
}
