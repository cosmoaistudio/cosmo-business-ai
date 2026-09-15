import { describe, expect, it } from "vitest";
import { conditionEvaluator } from "@/features/automation/services/conditionEvaluator.service";

describe("AutomationEngine — conditionEvaluator", () => {
  it("retorna true sem condições", () => {
    expect(conditionEvaluator.evaluate([], { quantity: 0 })).toBe(true);
  });

  it("avalia operador eq", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "status", operator: "eq", value: "active" }],
        { status: "active" }
      )
    ).toBe(true);
  });

  it("avalia operador lte para estoque", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "quantity", operator: "lte", value: 0 }],
        { quantity: 0 }
      )
    ).toBe(true);
  });

  it("avalia campo aninhado", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "product.status", operator: "eq", value: "inactive" }],
        { product: { status: "inactive" } }
      )
    ).toBe(true);
  });

  it("avalia operador contains", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "name", operator: "contains", value: "bacon" }],
        { name: "Hambúrguer Bacon" }
      )
    ).toBe(true);
  });

  it("avalia operador exists", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "optionId", operator: "exists", value: null }],
        { optionId: "opt-1" }
      )
    ).toBe(true);
  });

  it("falha quando condição não satisfeita", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "quantity", operator: "gt", value: 10 }],
        { quantity: 5 }
      )
    ).toBe(false);
  });

  it("avalia operadores neq, gt, gte, lt, lte", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "status", operator: "neq", value: "inactive" }],
        { status: "active" }
      )
    ).toBe(true);
    expect(
      conditionEvaluator.evaluate(
        [{ field: "qty", operator: "gt", value: 5 }],
        { qty: 10 }
      )
    ).toBe(true);
    expect(
      conditionEvaluator.evaluate(
        [{ field: "qty", operator: "gte", value: 10 }],
        { qty: 10 }
      )
    ).toBe(true);
    expect(
      conditionEvaluator.evaluate(
        [{ field: "qty", operator: "lt", value: 5 }],
        { qty: 3 }
      )
    ).toBe(true);
    expect(
      conditionEvaluator.evaluate(
        [{ field: "qty", operator: "lte", value: 3 }],
        { qty: 3 }
      )
    ).toBe(true);
  });

  it("operador desconhecido retorna false", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "x", operator: "unknown" as never, value: 1 }],
        { x: 1 }
      )
    ).toBe(false);
  });

  it("campo aninhado inexistente falha exists", () => {
    expect(
      conditionEvaluator.evaluate(
        [{ field: "product.stock.level", operator: "exists", value: null }],
        { product: { stock: null } }
      )
    ).toBe(false);
  });
});
