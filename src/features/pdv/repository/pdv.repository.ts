import { supabase } from "@/config/supabase";
import type {
  FinalizeSaleDTO,
  FinalizeSaleResult,
} from "../types/sale";

export async function finalizeSale(
  payload: FinalizeSaleDTO
): Promise<FinalizeSaleResult> {
  const { data, error } = await supabase.rpc("finalize_sale", {
    p_items: payload.items,
    p_payment_method: payload.payment_method,
    p_payment_amount: payload.payment_amount,
    p_discount: payload.discount ?? 0,
    p_observation: payload.observation ?? null,
    p_customer_id: payload.customer_id ?? null,
  });

  if (error) throw error;

  return data as FinalizeSaleResult;
}
