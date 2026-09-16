import type { Product, ProductMenuKind } from "../types/product";
import {
  normalizeFeatured,
  parsePromotionalPrice,
} from "./productDigitalPromo";
import { resolveProductImage } from "./productImage";

export type ProductRow = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  price: number | string;
  stock?: number | string | null;
  min_stock?: number | string | null;
  image_url?: string | null;
  image?: string | null;
  status?: Product["status"] | null;
  menu_kind?: ProductMenuKind | null;
  combo_selection_mode?: Product["combo_selection_mode"] | null;
  combo_min_choices?: number | null;
  combo_max_choices?: number | null;
  promotional_price?: number | string | null;
  promotionalPrice?: number | string | null;
  featured?: boolean | null;
  created_at: string;
  updated_at?: string | null;
};

export type ProductWriteDTO = {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  stock?: number;
  min_stock?: number;
  image_url?: string | null;
  status?: Product["status"];
  menu_kind?: ProductMenuKind;
  combo_selection_mode?: Product["combo_selection_mode"];
  combo_min_choices?: number | null;
  combo_max_choices?: number | null;
  promotionalPrice?: number | null;
  featured?: boolean;
};

/**
 * Maps a DB/API row to Product. Unknown keys are dropped so updates never
 * persist a raw PostgREST row. Old products without promo columns stay valid.
 */
export function normalizeProduct(row: ProductRow): Product {
  const imageUrl = resolveProductImage(row);

  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    description: row.description ?? "",
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    min_stock: Number(row.min_stock) || 0,
    image_url: imageUrl || null,
    image: imageUrl || undefined,
    status: row.status === "inactive" ? "inactive" : "active",
    menu_kind: row.menu_kind ?? undefined,
    combo_selection_mode: row.combo_selection_mode ?? undefined,
    combo_min_choices: row.combo_min_choices ?? undefined,
    combo_max_choices: row.combo_max_choices ?? undefined,
    promotionalPrice: parsePromotionalPrice(
      row.promotionalPrice ?? row.promotional_price
    ),
    featured: normalizeFeatured(row.featured),
    created_at: row.created_at,
    updated_at: row.updated_at ?? undefined,
  };
}

/** Explicit write DTO → products columns. Never spreads a raw row. */
export function toProductWriteRow(
  dto: ProductWriteDTO
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if (dto.name !== undefined) row.name = dto.name;
  if (dto.category !== undefined) row.category = dto.category;
  if (dto.description !== undefined) row.description = dto.description;
  if (dto.price !== undefined) row.price = dto.price;
  if (dto.stock !== undefined) row.stock = dto.stock;
  if (dto.min_stock !== undefined) row.min_stock = dto.min_stock;
  if (dto.image_url !== undefined) row.image_url = dto.image_url;
  if (dto.status !== undefined) row.status = dto.status;
  if (dto.menu_kind !== undefined) row.menu_kind = dto.menu_kind;
  if (dto.combo_selection_mode !== undefined) {
    row.combo_selection_mode = dto.combo_selection_mode;
  }
  if (dto.combo_min_choices !== undefined) {
    row.combo_min_choices = dto.combo_min_choices;
  }
  if (dto.combo_max_choices !== undefined) {
    row.combo_max_choices = dto.combo_max_choices;
  }
  if (dto.promotionalPrice !== undefined) {
    row.promotional_price = parsePromotionalPrice(dto.promotionalPrice);
  }
  if (dto.featured !== undefined) {
    row.featured = dto.featured === true;
  }

  return row;
}

export function stripDigitalPromoColumns(row: Record<string, unknown>) {
  const { promotional_price: _price, featured: _featured, ...rest } = row;
  return rest;
}

export function isMissingDigitalPromoColumnError(error: {
  message?: string;
  code?: string;
}) {
  const message = error.message ?? "";
  return (
    /promotional_price/i.test(message) ||
    (/featured/i.test(message) && /products/i.test(message)) ||
    (error.code === "PGRST204" && /featured/i.test(message))
  );
}
