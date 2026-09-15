import type { OptionGroup } from "./optionGroup";

export interface ProductOptionGroup {
  id: string;
  product_id: string;
  group_id: string;
  sort_order: number;
  created_at: string;
}

export type CreateProductOptionGroupDTO = Omit<
  ProductOptionGroup,
  "id" | "created_at"
>;

export type UpdateProductOptionGroupDTO = Partial<
  Pick<ProductOptionGroup, "sort_order" | "group_id">
>;

export interface ProductOptionGroupWithGroup extends ProductOptionGroup {
  option_groups: OptionGroup | null;
}

export interface ProductComposition {
  product_id: string;
  groups: ProductOptionGroupWithGroup[];
}
