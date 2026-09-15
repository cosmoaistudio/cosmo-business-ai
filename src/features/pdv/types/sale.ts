export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "pix";

export type SaleStatus = "completed" | "cancelled";

export interface Sale {
  id: string;
  sale_number: number;
  subtotal: number;
  total: number;
  status: SaleStatus;
  customer_id?: string | null;
  receipt_issued_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface SaleItemOption {
  id: string;
  sale_item_id: string;
  option_id: string;
  option_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  created_at: string;
}

export interface FinalizeSaleResult {
  id: string;
  sale_number: number;
  subtotal: number;
  discount: number;
  total: number;
  status: SaleStatus;
  payment_method: PaymentMethod;
  payment_amount: number;
  change_amount: number;
  customer_id?: string | null;
}

export interface FinalizeSaleItemOptionDTO {
  option_id: string;
  quantity?: number;
}

export interface FinalizeSaleComponentDTO {
  component_id: string;
  product_id: string;
  quantity: number;
  unit_index?: number;
  label?: string;
  options?: FinalizeSaleItemOptionDTO[];
}

export interface FinalizeSaleItemDTO {
  product_id: string;
  quantity: number;
  unit_price?: number;
  options?: FinalizeSaleItemOptionDTO[];
  /** Present for menu_kind=combo after migration 026 */
  components?: FinalizeSaleComponentDTO[];
}

export interface FinalizeSaleDTO {
  items: FinalizeSaleItemDTO[];
  payment_method: PaymentMethod;
  payment_amount: number;
  discount?: number;
  observation?: string;
  customer_id?: string | null;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "PIX",
};
