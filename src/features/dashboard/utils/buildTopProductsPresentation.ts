/**
 * Presentation helpers for period top-products ranking.
 * Does NOT re-rank: preserves order from snapshot.topProducts.
 */

import { formatCurrency, formatNumber } from "@/lib/format";
import type { TopSellingProduct } from "../types/dashboard";

export const TOP_PRODUCTS_DISPLAY_LIMIT = 5;

export interface TopProductPresentationRow {
  rank: number;
  productId: string;
  productName: string;
  image?: string | null;
  totalQuantity: number;
  totalRevenue: number;
  /** null when totalUnitsSold is 0 — never Infinity/NaN */
  sharePercent: number | null;
  shareLabel: string | null;
  quantityLabel: string;
  revenueLabel: string;
  isLeader: boolean;
}

export function formatSoldUnits(quantity: number): string {
  const safe = Number(quantity) || 0;
  if (safe === 1) return "1 unidade";
  return `${formatNumber(safe)} unidades`;
}

export function formatSharePercent(sharePercent: number): string {
  return `${sharePercent.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

/**
 * Build display rows from already-ranked topProducts.
 * Share uses period totalUnitsSold (all sale items), not only the top 5 sum.
 */
export function buildTopProductsPresentation(
  products: TopSellingProduct[],
  totalUnitsSold: number,
  limit = TOP_PRODUCTS_DISPLAY_LIMIT
): TopProductPresentationRow[] {
  const ranked = products.slice(0, limit);
  const total = Math.max(0, Number(totalUnitsSold) || 0);

  return ranked.map((product, index) => {
    const quantity = Number(product.totalQuantity) || 0;
    const revenue = Number(product.totalRevenue) || 0;
    const sharePercent =
      total > 0 ? Math.round((quantity / total) * 1000) / 10 : null;

    return {
      rank: index + 1,
      productId: product.productId,
      productName: product.productName,
      image: product.image,
      totalQuantity: quantity,
      totalRevenue: revenue,
      sharePercent,
      shareLabel:
        sharePercent === null ? null : formatSharePercent(sharePercent),
      quantityLabel: formatSoldUnits(quantity),
      revenueLabel: formatCurrency(revenue),
      isLeader: index === 0 && quantity > 0,
    };
  });
}
