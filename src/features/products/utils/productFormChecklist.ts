/**
 * Visual completeness checklist for the product editor.
 * Does NOT change validation rules — optional fields stay optional.
 */

export type ProductChecklistKind = "required" | "optional";

export interface ProductChecklistItem {
  id: string;
  label: string;
  kind: ProductChecklistKind;
  done: boolean;
}

export interface ProductChecklistInput {
  name: string;
  category: string;
  price: string | number;
  description?: string;
  imageUrl?: string;
  status?: string;
  /** When true, category is auto-filled (combos) and not shown as required. */
  hideCategory?: boolean;
  hasAddons?: boolean;
  /** Show composition row only when product type uses it. */
  showComposition?: boolean;
  hasComposition?: boolean;
}

export function buildProductFormChecklist(
  input: ProductChecklistInput
): ProductChecklistItem[] {
  const priceNumber =
    typeof input.price === "number"
      ? input.price
      : Number(String(input.price).replace(",", "."));

  const items: ProductChecklistItem[] = [
    {
      id: "name",
      label: "Nome",
      kind: "required",
      done: Boolean(input.name.trim()),
    },
  ];

  if (!input.hideCategory) {
    items.push({
      id: "category",
      label: "Categoria",
      kind: "required",
      done: Boolean(input.category.trim()),
    });
  }

  items.push(
    {
      id: "price",
      label: "Preço",
      kind: "required",
      done: Number.isFinite(priceNumber) && priceNumber >= 0 && String(input.price).trim() !== "",
    },
    {
      id: "photo",
      label: "Foto",
      kind: "optional",
      done: Boolean(input.imageUrl?.trim()),
    },
    {
      id: "description",
      label: "Descrição",
      kind: "optional",
      done: Boolean(input.description?.trim()),
    },
    {
      id: "addons",
      label: "Adicionais",
      kind: "optional",
      done: Boolean(input.hasAddons),
    }
  );

  if (input.showComposition) {
    items.push({
      id: "composition",
      label: "Composição",
      kind: "optional",
      done: Boolean(input.hasComposition),
    });
  }

  return items;
}

export function summarizeProductChecklist(items: ProductChecklistItem[]): {
  requiredDone: number;
  requiredTotal: number;
  optionalDone: number;
  optionalTotal: number;
  readyToSave: boolean;
} {
  const required = items.filter((item) => item.kind === "required");
  const optional = items.filter((item) => item.kind === "optional");
  const requiredDone = required.filter((item) => item.done).length;
  const optionalDone = optional.filter((item) => item.done).length;

  return {
    requiredDone,
    requiredTotal: required.length,
    optionalDone,
    optionalTotal: optional.length,
    readyToSave: required.every((item) => item.done),
  };
}
