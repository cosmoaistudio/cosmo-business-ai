import type { RemoteCommandResult } from "../../shared/remoteCommands.js";
import { getDesktopSupabase } from "../repository/supabaseClient.js";

export class OperationsRepository {
  async resolveOrderLines(payload: Record<string, unknown>): Promise<string[]> {
    if (Array.isArray(payload.lines)) {
      return payload.lines.map(String);
    }

    const saleId = payload.saleId ? String(payload.saleId) : null;
    const supabase = getDesktopSupabase();

    if (!saleId || !supabase) {
      return [`Pedido: ${payload.orderId ?? payload.saleNumber ?? "—"}`];
    }

    const { data: sale } = await supabase
      .from("sales")
      .select("sale_number, total, created_at")
      .eq("id", saleId)
      .maybeSingle();

    if (!sale) {
      return [`Venda não encontrada: ${saleId}`];
    }

    return [
      `Venda #${sale.sale_number}`,
      `Total: R$ ${Number(sale.total).toFixed(2)}`,
      `Data: ${new Date(sale.created_at).toLocaleString("pt-BR")}`,
    ];
  }

  async openCashRegister(
    payload: Record<string, unknown>,
    organizationId: string
  ): Promise<RemoteCommandResult> {
    const supabase = getDesktopSupabase();
    if (!supabase) return { ok: false, error: "Supabase indisponível" };

    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({
        organization_id: organizationId,
        opening_balance: Number(payload.openingBalance ?? 0),
        notes: payload.notes ? String(payload.notes) : null,
        status: "open",
      })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { sessionId: data.id } };
  }

  async closeCashRegister(
    payload: Record<string, unknown>,
    organizationId: string
  ): Promise<RemoteCommandResult> {
    const supabase = getDesktopSupabase();
    if (!supabase) return { ok: false, error: "Supabase indisponível" };

    const sessionId = payload.sessionId ? String(payload.sessionId) : null;

    let query = supabase
      .from("cash_sessions")
      .update({
        status: "closed",
        closing_balance: Number(payload.closingBalance ?? 0),
        closed_at: new Date().toISOString(),
        notes: payload.notes ? String(payload.notes) : null,
      })
      .eq("organization_id", organizationId)
      .eq("status", "open");

    if (sessionId) {
      query = query.eq("id", sessionId);
    }

    const { data, error } = await query.select("*");

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { closed: data?.length ?? 0 } };
  }

  async setProductStatus(
    productId: string,
    status: "active" | "inactive"
  ): Promise<RemoteCommandResult> {
    const supabase = getDesktopSupabase();
    if (!productId || !supabase) {
      return { ok: false, error: "productId ou Supabase ausente" };
    }

    const { error } = await supabase.from("products").update({ status }).eq("id", productId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { productId, status } };
  }

  async setOptionActive(optionId: string, active: boolean): Promise<RemoteCommandResult> {
    const supabase = getDesktopSupabase();
    if (!optionId || !supabase) {
      return { ok: false, error: "optionId ou Supabase ausente" };
    }

    const { error } = await supabase.from("options").update({ active }).eq("id", optionId);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { optionId, active } };
  }

  async updateStock(
    payload: Record<string, unknown>,
    organizationId: string
  ): Promise<RemoteCommandResult> {
    const supabase = getDesktopSupabase();
    if (!supabase) return { ok: false, error: "Supabase indisponível" };

    const quantity = Number(payload.quantity ?? 0);
    const productId = payload.productId ? String(payload.productId) : null;
    const optionId = payload.optionId ? String(payload.optionId) : null;
    const movementType = String(payload.movementType ?? "adjustment");

    if (productId) {
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single();

      if (fetchError) return { ok: false, error: fetchError.message };

      const nextStock =
        movementType === "in"
          ? Number(product.stock) + quantity
          : movementType === "out"
            ? Number(product.stock) - quantity
            : quantity;

      const { error } = await supabase
        .from("products")
        .update({ stock: nextStock })
        .eq("id", productId);

      if (error) return { ok: false, error: error.message };

      await supabase.from("stock_movements").insert({
        organization_id: organizationId,
        product_id: productId,
        movement_type: movementType,
        quantity,
        reason: payload.reason ? String(payload.reason) : "remote-mobile",
      });

      return { ok: true, data: { productId, stock: nextStock } };
    }

    if (optionId) {
      const { data: option, error: fetchError } = await supabase
        .from("options")
        .select("stock")
        .eq("id", optionId)
        .single();

      if (fetchError) return { ok: false, error: fetchError.message };

      const nextStock =
        movementType === "in"
          ? Number(option.stock) + quantity
          : movementType === "out"
            ? Number(option.stock) - quantity
            : quantity;

      const { error } = await supabase
        .from("options")
        .update({ stock: nextStock })
        .eq("id", optionId);

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { optionId, stock: nextStock } };
    }

    return { ok: false, error: "Informe productId ou optionId" };
  }
}

export const operationsRepository = new OperationsRepository();
