import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildBuilderCartPayload,
} from "@/features/product-engine/core/productBuilderCore";
import { createCartItem, createProduct } from "../fixtures/cart";
import {
  createCompositeProductNode,
  createInitialBuildState,
  createOutOfStockNode,
  createPausedOptionNode,
  createSimpleProductNode,
  validCompositeSelections,
} from "../fixtures/productEngine";

vi.mock("@/config/supabase", () => ({
  supabase: { rpc: vi.fn(), from: vi.fn() },
}));

vi.mock("@/lib/automation-events", () => ({
  emitAutomationEvent: vi.fn(),
}));

vi.mock("@/desktop/types", () => ({
  getDesktopApi: vi.fn().mockReturnValue({
    enqueuePrint: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/features/remote-commands/remoteCommands.service", () => ({
  remoteCommandsService: {
    dispatchPrintOrder: vi.fn().mockResolvedValue({ id: "print-cmd" }),
  },
}));

import { supabase } from "@/config/supabase";
import { pdvService } from "@/features/pdv/services/pdv.service";
import { getDesktopApi } from "@/desktop/types";
import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";

const saleResult = {
  id: "sale-e2e",
  sale_number: 1001,
  total: 8,
  subtotal: 8,
  discount: 0,
  payment_method: "cash",
  payment_amount: 8,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(supabase.rpc).mockResolvedValue({ data: saleResult, error: null });
});

describe("E2E — Venda simples", () => {
  it("produto sem composição vai direto ao carrinho e finaliza", async () => {
    const product = createSimpleProductNode();
    const cartItem = createCartItem({
      product: createProduct({
        id: product.productId,
        name: product.productName,
        price: product.basePrice,
      }),
      unitPrice: product.basePrice,
    });

    const result = await pdvService.finalizeSaleFromCart(
      [cartItem],
      "cash",
      8,
      0,
      "",
      null,
      "org-1"
    );

    expect(result.sale_number).toBe(1001);
    expect(supabase.rpc).toHaveBeenCalled();
  });
});

describe("E2E — Venda composta", () => {
  it("produto com opções valida, precifica e finaliza", async () => {
    const node = createCompositeProductNode();
    const build = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "pdv");

    expect(build.valid).toBe(true);

    const cartItem = createCartItem({
      product: createProduct({
        id: node.productId,
        name: node.productName,
        price: node.basePrice,
      }),
      unitPrice: build.pricing.total,
      selectedOptions: build.cartPayload!.selectedOptions.map((opt) => ({
        optionId: opt.optionId,
        optionName: opt.optionName,
        groupId: "",
        groupName: "",
        quantity: opt.quantity,
        unitPrice: opt.price,
      })),
    });

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { ...saleResult, total: build.pricing.total, sale_number: 1002 },
      error: null,
    });

    const result = await pdvService.finalizeSaleFromCart(
      [cartItem],
      "pix",
      build.pricing.total,
      0,
      "",
      null,
      "org-1"
    );

    expect(result.total).toBe(build.pricing.total);
  });
});

describe("E2E — Produto sem estoque", () => {
  it("bloqueia composição com opção sem estoque", () => {
    const node = createOutOfStockNode();
    const result = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "pdv");

    expect(result.valid).toBe(false);
    expect(result.validation.errors.some((e) => e.includes("Estoque"))).toBe(true);
  });
});

describe("E2E — Opção pausada", () => {
  it("bloqueia seleção de opção indisponível", () => {
    const node = createPausedOptionNode();
    const result = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "pdv");

    expect(result.valid).toBe(false);
    expect(result.validation.errors.some((e) => e.includes("indisponível"))).toBe(true);
  });
});

describe("E2E — Reativação automática", () => {
  it("simula fluxo de estoque restaurado permitindo venda", () => {
    const node = createOutOfStockNode();
    const blocked = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "pdv");
    expect(blocked.valid).toBe(false);

    const restored = createCompositeProductNode();
    const allowed = buildBuilderCartPayload(restored, {
      ...createInitialBuildState(restored.productId),
      selections: validCompositeSelections(),
    }, "pdv");
    expect(allowed.valid).toBe(true);
  });
});

describe("E2E — Venda impressa", () => {
  it("despacha impressão via desktop API e remote command", async () => {
    const cartItem = createCartItem({ unitPrice: 20 });
    await pdvService.finalizeSaleFromCart(
      [cartItem],
      "cash",
      20,
      0,
      "Mesa 5",
      null,
      "org-desktop"
    );

    expect(getDesktopApi()?.enqueuePrint).toHaveBeenCalled();
    expect(remoteCommandsService.dispatchPrintOrder).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-desktop" })
    );
  });
});

describe("E2E — Venda Mobile", () => {
  it("usa canal mobile no payload do builder", () => {
    const node = createCompositeProductNode();
    const result = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "mobile");

    expect(result.valid).toBe(true);
    expect(result.cartPayload?.channel).toBe("mobile");
  });
});

describe("E2E — Venda Desktop", () => {
  it("usa canal desktop no payload do builder", () => {
    const node = createCompositeProductNode();
    const result = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "desktop");

    expect(result.valid).toBe(true);
    expect(result.cartPayload?.channel).toBe("desktop");
  });
});
