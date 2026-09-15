import type { Product } from "@/features/products/types/product";
import type { ProductComboComponent } from "../types/combo";

export function canAddProductAsComboComponent(input: {
  comboProductId: string;
  candidate: Pick<Product, "id" | "status" | "menu_kind" | "name">;
  /** choice mode exige apenas assembled */
  requireAssembled?: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (input.candidate.id === input.comboProductId) {
    return { ok: false, error: "O combo não pode incluir a si mesmo." };
  }
  if (input.candidate.menu_kind === "combo") {
    return { ok: false, error: "Não é permitido adicionar outro combo." };
  }
  if (input.candidate.status !== "active") {
    return { ok: false, error: "Produto inativo não pode entrar no combo." };
  }
  if (input.requireAssembled && input.candidate.menu_kind !== "assembled") {
    return {
      ok: false,
      error: "Neste combo só entram copos montados.",
    };
  }
  return { ok: true };
}

export function filterComboComponentCatalog(
  products: Product[],
  comboProductId: string,
  options?: { requireAssembled?: boolean }
): Product[] {
  return products.filter((product) => {
    const check = canAddProductAsComboComponent({
      comboProductId,
      candidate: product,
      requireAssembled: options?.requireAssembled,
    });
    return check.ok;
  });
}

/** Mesmo produto em dois slots é permitido (slots independentes). */
export function allowDuplicateProductSlots(): boolean {
  return true;
}

export function normalizeSlotQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

export function nextComboSortOrder(
  components: Array<Pick<ProductComboComponent, "sort_order">>
): number {
  if (components.length === 0) return 0;
  return Math.max(...components.map((row) => row.sort_order)) + 1;
}

export function reorderComboSlotIds(
  orderedIds: string[],
  fromIndex: number,
  toIndex: number
): string[] | null {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= orderedIds.length ||
    toIndex >= orderedIds.length ||
    fromIndex === toIndex
  ) {
    return null;
  }
  const next = [...orderedIds];
  const [row] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, row);
  return next;
}

/** Atualizações devem usar o id do slot existente (nunca recriar sem necessidade). */
export function shouldPreserveExistingSlotId(
  existingSlotId: string | undefined | null
): boolean {
  return Boolean(existingSlotId);
}

export function buildDefaultDisplayName(
  productName: string,
  slotIndex: number
): string {
  return `${productName}`.trim() || `Item ${slotIndex + 1}`;
}

export function describeRemoveImpact(saleItemCount: number): string {
  if (saleItemCount <= 0) {
    return "Remover este produto do combo?";
  }
  return `Este componente já aparece em ${saleItemCount} item(ns) de venda. Remover o slot pode afetar histórico/KDS. Deseja continuar?`;
}
