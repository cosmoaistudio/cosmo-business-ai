import type { Product } from "@/features/products/types/product";
import type { EnginePrintSummary } from "@/features/product-engine/types/productEngine.types";

export interface CartItemSummaries {
  print: EnginePrintSummary;
  kitchen: EnginePrintSummary;
  customer: EnginePrintSummary;
}

export interface CartSelectedOption {
  optionId: string;
  optionName: string;
  groupId: string;
  groupName: string;
  price: number;
  quantity?: number;
}

/**
 * One configured UNIT inside a combo commercial line.
 * Choice mode: always quantity=1 per unit (never collapse distinct configs).
 * Fixed mode: quantity may mirror slot.quantity (legacy 026).
 */
export interface CartComboComponent {
  componentId: string;
  productId: string;
  productName: string;
  displayName: string;
  /** Per-unit qty (choice=1; fixed=slot.quantity). */
  quantity: number;
  /** Stable unit position (Copo 1, Copo 2…). Required for choice. */
  unitIndex: number;
  allowConfiguration: boolean;
  selectedOptions: CartSelectedOption[];
  observation?: string;
  /** Paid addons only (max_free already applied); child base excluded */
  addonsTotal: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  selectedOptions: CartSelectedOption[];
  observation: string;
  summaries?: CartItemSummaries;
  engineChannel?: string;
  /** Present when product.menu_kind === 'combo' */
  comboComponents?: CartComboComponent[];
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface AddCartItemInput {
  product: Product;
  quantity: number;
  unitPrice: number;
  selectedOptions?: CartSelectedOption[];
  observation?: string;
  summaries?: CartItemSummaries;
  engineChannel?: string;
  comboComponents?: CartComboComponent[];
  /** When set, replaces this cart line instead of appending/merging. */
  replaceItemId?: string;
}
