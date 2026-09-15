import type { CompositionOption } from "./option";
import type { ProductOptionGroupWithGroup } from "./productOptionGroup";

export interface ProductOptionGroupWithOptions extends ProductOptionGroupWithGroup {
  options: CompositionOption[];
}

export interface ProductCompositionWithOptions {
  product_id: string;
  groups: ProductOptionGroupWithOptions[];
}
