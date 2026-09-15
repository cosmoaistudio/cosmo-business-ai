import { describe, expect, it, vi, beforeEach } from "vitest";
import { finalizeSale } from "@/features/pdv/repository/pdv.repository";
import { pdvService } from "@/features/pdv/services/pdv.service";
import { createCartItem, createProduct } from "../../fixtures/cart";

vi.mock("@/config/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

vi.mock("@/lib/automation-events", () => ({
  emitAutomationEvent: vi.fn(),
}));

vi.mock("@/desktop/types", () => ({
  getDesktopApi: vi.fn().mockReturnValue(null),
}));

vi.mock("@/features/remote-commands/remoteCommands.service", () => ({
  remoteCommandsService: {
    dispatchPrintOrder: vi.fn().mockResolvedValue({ id: "cmd-1" }),
  },
}));

vi.mock("@/features/product-engine/core/SummaryBuilder", () => ({
  summaryBuilder: {
    toPrintLines: vi.fn().mockReturnValue(["Linha resumo engine"]),
  },
}));

import { supabase } from "@/config/supabase";
import { emitAutomationEvent } from "@/lib/automation-events";
import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";

describe("PDV — finalize_sale RPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finalizeSale chama RPC com payload correto", async () => {
    const saleResult = {
      id: "sale-1",
      sale_number: 42,
      total: 50,
      subtotal: 50,
      discount: 0,
      payment_method: "cash",
      payment_amount: 50,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: saleResult,
      error: null,
    });

    const result = await finalizeSale({
      items: [{ product_id: "p1", quantity: 1, unit_price: 50, options: [] }],
      payment_method: "cash",
      payment_amount: 50,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("finalize_sale", {
      p_items: expect.any(Array),
      p_payment_method: "cash",
      p_payment_amount: 50,
      p_discount: 0,
      p_observation: null,
      p_customer_id: null,
    });
    expect(result.sale_number).toBe(42);
  });

  it("propaga erro da RPC", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: "Carrinho vazio", code: "P0001" },
    });

    await expect(
      finalizeSale({
        items: [],
        payment_method: "cash",
        payment_amount: 0,
      })
    ).rejects.toEqual({ message: "Carrinho vazio", code: "P0001" });
  });

  it("pdvService.finalizeSaleFromCart emite eventos e despacha impressão", async () => {
    const saleResult = {
      id: "sale-2",
      sale_number: 99,
      total: 30,
      subtotal: 30,
      discount: 0,
      payment_method: "pix",
      payment_amount: 30,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: saleResult, error: null });

    const cartItem = createCartItem({
      product: createProduct({ id: "p1", name: "Combo" }),
      unitPrice: 30,
      selectedOptions: [
        {
          optionId: "opt-1",
          optionName: "Bacon",
          groupId: "g1",
          groupName: "Extra",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });

    const result = await pdvService.finalizeSaleFromCart(
      [cartItem],
      "pix",
      30,
      0,
      "Sem cebola",
      null,
      "org-1"
    );

    expect(result.sale_number).toBe(99);
    expect(emitAutomationEvent).toHaveBeenCalledWith(
      "SALE_COMPLETED",
      expect.objectContaining({ saleId: "sale-2" })
    );
    expect(emitAutomationEvent).toHaveBeenCalledWith(
      "STOCK_CHANGED",
      expect.objectContaining({ optionId: "opt-1" })
    );
    expect(remoteCommandsService.dispatchPrintOrder).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", saleNumber: 99 })
    );
  });

  it("usa summaries do engine na impressão", async () => {
    const saleResult = {
      id: "sale-3",
      sale_number: 50,
      total: 40,
      subtotal: 40,
      discount: 0,
      payment_method: "cash",
      payment_amount: 40,
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: saleResult, error: null });

    const cartItem = createCartItem({
      unitPrice: 40,
      summaries: {
        customer: { lines: ["Combo · Médio · BBQ"] },
        kitchen: { lines: [] },
        print: { lines: ["Combo · Médio · BBQ"] },
      },
    });

    await pdvService.finalizeSaleFromCart(
      [cartItem],
      "cash",
      40,
      0,
      "",
      null,
      "org-1"
    );

    const { summaryBuilder } = await import(
      "@/features/product-engine/core/SummaryBuilder"
    );
    expect(summaryBuilder.toPrintLines).toHaveBeenCalled();
  });

  it("continua venda quando impressão falha", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        id: "sale-4",
        sale_number: 77,
        total: 30,
        subtotal: 30,
        discount: 0,
        payment_method: "cash",
        payment_amount: 30,
      },
      error: null,
    });

    vi.mocked(remoteCommandsService.dispatchPrintOrder).mockRejectedValueOnce(
      new Error("Desktop offline")
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await pdvService.finalizeSaleFromCart(
      [createCartItem()],
      "cash",
      30,
      0,
      "",
      null,
      "org-1"
    );

    expect(result.sale_number).toBe(77);
    expect(warnSpy).toHaveBeenCalledWith(
      "Falha ao despachar impressão:",
      expect.any(Error)
    );

    warnSpy.mockRestore();
  });
});
