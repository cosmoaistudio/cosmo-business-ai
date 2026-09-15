import { describe, expect, it } from "vitest";
import { formatKitchenLinesFromTicket } from "@/features/kitchen-display/integrations/productEngine.adapter";
import type { KitchenTicket } from "@/features/kitchen-display/types/kitchenDisplay.types";
import { buildComboKitchenSummaryNamed } from "@/features/pdv/utils/comboFinalizeContract";

describe("KDS / impressão de combo por unidade", () => {
  it("summary usa nome real do assembled, não 'Copo 1'", () => {
    const text = buildComboKitchenSummaryNamed([
      {
        componentId: "opt-1",
        productId: "mousse",
        productName: "Açaí Mousse de Morango",
        unitIndex: 1,
        label: "Copo 1",
        childQtyPerCombo: 1,
        allowConfiguration: true,
        options: [{ option_id: "nutella", quantity: 1 }],
        paidAddons: 3,
        optionNames: { nutella: "Nutella" },
      },
      {
        componentId: "opt-1",
        productId: "mousse",
        productName: "Açaí Mousse de Morango",
        unitIndex: 2,
        label: "Copo 2",
        childQtyPerCombo: 1,
        allowConfiguration: true,
        options: [{ option_id: "ovo", quantity: 1 }],
        paidAddons: 2.5,
        optionNames: { ovo: "Ovomaltine" },
      },
    ]);

    expect(text).toBe(
      [
        "COPO 1 — Açaí Mousse de Morango",
        "+ Nutella",
        "COPO 2 — Açaí Mousse de Morango",
        "+ Ovomaltine",
      ].join("\n")
    );
  });

  it("formatKitchenLinesFromTicket preserva COMBO + COPO N + adicionais", () => {
    const ticket: KitchenTicket = {
      id: "t1",
      organizationId: "org",
      saleId: "s1",
      saleNumber: 10,
      status: "pending",
      priority: "normal",
      ticketType: "counter",
      assignedTo: null,
      customerName: null,
      notes: null,
      estimatedMinutes: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      items: [
        {
          id: "i1",
          saleItemId: "si1",
          productId: "combo-2",
          productName: "Combo 2 Açaís",
          quantity: 1,
          summary: [
            "COPO 1 — Açaí Mousse de Morango",
            "+ Nutella",
            "COPO 2 — Açaí Ninho",
            "+ Ovomaltine",
          ].join("\n"),
          status: "pending",
        },
      ],
    };

    const lines = formatKitchenLinesFromTicket(ticket);
    expect(lines.map((line) => line.text)).toEqual([
      "1x Combo 2 Açaís",
      "COPO 1 — Açaí Mousse de Morango",
      "+ Nutella",
      "COPO 2 — Açaí Ninho",
      "+ Ovomaltine",
    ]);
  });
});
