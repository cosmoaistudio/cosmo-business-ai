import type { Product } from "@/features/products/types/product";

export type ProductMenuKindDb = "simple" | "assembled" | "combo";

export interface ProductComboComponent {
  id: string;
  organization_id: string;
  combo_product_id: string;
  component_product_id: string;
  display_name: string | null;
  quantity: number;
  sort_order: number;
  allow_configuration: boolean;
  active: boolean;
  created_at: string;
  updated_at?: string;
  /** Joined when loaded with product */
  component_product?: Pick<
    Product,
    "id" | "name" | "price" | "status" | "stock" | "image_url"
  > | null;
}

export interface CreateComboComponentDTO {
  combo_product_id: string;
  component_product_id: string;
  display_name?: string | null;
  quantity?: number;
  sort_order?: number;
  allow_configuration?: boolean;
  active?: boolean;
}

export interface UpdateComboComponentDTO {
  component_product_id?: string;
  display_name?: string | null;
  quantity?: number;
  sort_order?: number;
  allow_configuration?: boolean;
  active?: boolean;
}
