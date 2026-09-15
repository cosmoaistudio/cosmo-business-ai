import { supabase } from "@/config/supabase";
import type {
  RegisterStockMovementDTO,
  RegisterStockMovementResult,
  StockMovement,
} from "../types/inventory";

export async function getStockMovements(limit = 100) {
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
      *,
      products ( id, name, image_url, image )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data as StockMovement[];
}

export async function registerStockMovement(
  payload: RegisterStockMovementDTO
): Promise<RegisterStockMovementResult> {
  const { data, error } = await supabase.rpc("register_stock_movement", {
    p_product_id: payload.product_id,
    p_movement_type: payload.movement_type,
    p_quantity: payload.quantity,
    p_notes: payload.notes ?? null,
  });

  if (error) throw error;

  return data as RegisterStockMovementResult;
}
