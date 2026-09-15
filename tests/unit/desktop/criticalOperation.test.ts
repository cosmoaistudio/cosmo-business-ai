import { describe, expect, it, beforeEach } from "vitest";
import {
  beginCriticalOperation,
  endCriticalOperation,
  getCriticalOperationReason,
  isCriticalOperationActive,
  listCriticalOperations,
  resetCriticalOperations,
} from "@/desktop/criticalOperation";
import {
  formatDownloadSpeed,
  isVisibleUpdatePhase,
} from "@/desktop/updater/types";

describe("criticalOperation", () => {
  beforeEach(() => {
    resetCriticalOperations();
  });

  it("fica inativo sem operações", () => {
    expect(isCriticalOperationActive()).toBe(false);
    expect(getCriticalOperationReason()).toBeNull();
  });

  it("bloqueia atualizar agora com o motivo da venda", () => {
    beginCriticalOperation(
      "pdv-cart",
      "Há uma venda em andamento. Finalize ou cancele o carrinho antes de atualizar."
    );
    expect(isCriticalOperationActive()).toBe(true);
    expect(getCriticalOperationReason()).toContain("venda em andamento");
    expect(listCriticalOperations()).toEqual(["pdv-cart"]);
  });

  it("libera depois de encerrar checkout e carrinho", () => {
    beginCriticalOperation("pdv-cart", "venda");
    beginCriticalOperation("pdv-checkout", "checkout");
    endCriticalOperation("pdv-checkout");
    expect(isCriticalOperationActive()).toBe(true);
    endCriticalOperation("pdv-cart");
    expect(isCriticalOperationActive()).toBe(false);
  });
});

describe("updater UI helpers", () => {
  it("não mostra UI invasiva em checking / up-to-date / idle", () => {
    expect(isVisibleUpdatePhase("checking")).toBe(false);
    expect(isVisibleUpdatePhase("up-to-date")).toBe(false);
    expect(isVisibleUpdatePhase("idle")).toBe(false);
    expect(isVisibleUpdatePhase("available")).toBe(true);
    expect(isVisibleUpdatePhase("downloading")).toBe(true);
    expect(isVisibleUpdatePhase("downloaded")).toBe(true);
    expect(isVisibleUpdatePhase("error")).toBe(true);
  });

  it("formata velocidade de download", () => {
    expect(formatDownloadSpeed(0)).toBe("");
    expect(formatDownloadSpeed(20 * 1024)).toBe("20 KB/s");
    expect(formatDownloadSpeed(1.5 * 1024 * 1024)).toBe("1.5 MB/s");
  });
});
