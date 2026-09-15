import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";
import type { TopSellingProduct } from "@/features/dashboard/types/dashboard";
import {
  TOP_PRODUCTS_DISPLAY_LIMIT,
  buildTopProductsPresentation,
  formatSharePercent,
  formatSoldUnits,
} from "@/features/dashboard/utils/buildTopProductsPresentation";

function product(
  name: string,
  quantity: number,
  revenue = quantity * 30
): TopSellingProduct {
  return {
    productId: `id-${name}`,
    productName: name,
    totalQuantity: quantity,
    totalRevenue: revenue,
  };
}

describe("formatSoldUnits", () => {
  it('quantidade 1 = "1 unidade"', () => {
    expect(formatSoldUnits(1)).toBe("1 unidade");
  });

  it('quantidade > 1 = "N unidades"', () => {
    expect(formatSoldUnits(2)).toBe("2 unidades");
    expect(formatSoldUnits(42)).toBe("42 unidades");
  });
});

describe("formatSharePercent", () => {
  it("arredonda com até 1 casa decimal no padrão pt-BR", () => {
    expect(formatSharePercent(31.7)).toBe("31,7%");
    expect(formatSharePercent(32)).toBe("32%");
  });
});

describe("buildTopProductsPresentation", () => {
  it("ranking com 1 produto", () => {
    const rows = buildTopProductsPresentation([product("Açaí", 10, 300)], 10);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      rank: 1,
      productName: "Açaí",
      totalQuantity: 10,
      totalRevenue: 300,
      sharePercent: 100,
      shareLabel: "100%",
      quantityLabel: "10 unidades",
      revenueLabel: formatCurrency(300),
      isLeader: true,
    });
  });

  it("ranking com 3 produtos preserva ordem e calcula participação", () => {
    const ranked = [
      product("A", 42, 1260),
      product("B", 30, 900),
      product("C", 28, 560),
    ];
    const rows = buildTopProductsPresentation(ranked, 100);

    expect(rows.map((r) => r.productName)).toEqual(["A", "B", "C"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rows[0].sharePercent).toBe(42);
    expect(rows[0].shareLabel).toBe("42%");
    expect(rows[0].quantityLabel).toBe("42 unidades");
    expect(rows[0].revenueLabel).toBe(formatCurrency(1260));
    expect(rows[0].isLeader).toBe(true);
    expect(rows[1].isLeader).toBe(false);
    expect(rows[2].isLeader).toBe(false);
  });

  it("limite máximo de 5 com mais de 5 produtos — sem reordenar", () => {
    const ranked = [
      product("P1", 50),
      product("P2", 40),
      product("P3", 30),
      product("P4", 20),
      product("P5", 10),
      product("P6", 5),
      product("P7", 1),
    ];
    const rows = buildTopProductsPresentation(ranked, 156);

    expect(TOP_PRODUCTS_DISPLAY_LIMIT).toBe(5);
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.productName)).toEqual([
      "P1",
      "P2",
      "P3",
      "P4",
      "P5",
    ]);
    expect(rows.find((r) => r.productName === "P6")).toBeUndefined();
  });

  it("participação usa totalUnitsSold do período (não só soma do top)", () => {
    const ranked = [product("Líder", 25, 500)];
    const rows = buildTopProductsPresentation(ranked, 100);
    expect(rows[0].sharePercent).toBe(25);
    expect(rows[0].shareLabel).toBe("25%");
  });

  it("arredonda participação em 1 casa (ex.: 31,7%)", () => {
    const rows = buildTopProductsPresentation([product("X", 31.666, 100)], 100);
    expect(rows[0].sharePercent).toBe(31.7);
    expect(rows[0].shareLabel).toBe("31,7%");
  });

  it("total de unidades zero → share null (sem Infinity/NaN)", () => {
    const rows = buildTopProductsPresentation([product("Z", 0, 0)], 0);
    expect(rows[0].sharePercent).toBeNull();
    expect(rows[0].shareLabel).toBeNull();
    expect(rows[0].isLeader).toBe(false);
  });

  it("lista vazia → sem linhas (estado vazio na UI)", () => {
    expect(buildTopProductsPresentation([], 0)).toEqual([]);
    expect(buildTopProductsPresentation([], 50)).toEqual([]);
  });

  it("quantidade 1 formata singular", () => {
    const rows = buildTopProductsPresentation([product("Único", 1, 15)], 1);
    expect(rows[0].quantityLabel).toBe("1 unidade");
    expect(rows[0].sharePercent).toBe(100);
  });

  it("não recalcula ranking: ordem de entrada é a ordem exibida", () => {
    // Entrada já “errada” de propósito — UI não deve reordenar
    const ranked = [
      product("Menor qty", 1, 999),
      product("Maior qty", 99, 1),
    ];
    const rows = buildTopProductsPresentation(ranked, 100);
    expect(rows.map((r) => r.productName)).toEqual([
      "Menor qty",
      "Maior qty",
    ]);
    expect(rows[0].isLeader).toBe(true);
  });

  it("destaca líder apenas na posição 1 com quantidade > 0", () => {
    const rows = buildTopProductsPresentation(
      [product("A", 5), product("B", 3)],
      8
    );
    expect(rows[0].isLeader).toBe(true);
    expect(rows[1].isLeader).toBe(false);
  });
});
