import type { MenuEditorSectionId, MenuPreviewSelectable } from "./menuEditor.types";
import { resolveEditorPanelSection } from "./menuEditor.types";

export const PREVIEW_SELECTABLE_LABELS: Record<MenuPreviewSelectable, string> = {
  header: "Header",
  banner: "Banner",
  search: "Busca",
  categories: "Categorias",
  catalog: "Grade de produtos",
  card: "Card de produto",
  highlights: "Destaques",
  cartbar: "Barra do carrinho",
  button: "Botões",
  productsheet: "Ficha do produto",
  checkout: "Checkout",
};

export const PREVIEW_SELECTABLE_TO_SECTION: Record<
  MenuPreviewSelectable,
  MenuEditorSectionId
> = {
  header: "identity",
  banner: "banner",
  search: "categories",
  categories: "categories",
  catalog: "layout",
  card: "products",
  highlights: "products",
  cartbar: "buttons",
  button: "buttons",
  productsheet: "products",
  checkout: "checkout",
};

export const SECTION_TO_PREVIEW: Partial<
  Record<MenuEditorSectionId, MenuPreviewSelectable>
> = {
  identity: "header",
  banner: "banner",
  products: "card",
  categories: "categories",
  layout: "catalog",
  buttons: "cartbar",
  checkout: "checkout",
  colors: "header",
  typography: "header",
};

export function sectionForPreviewTarget(
  target: MenuPreviewSelectable
): MenuEditorSectionId {
  return PREVIEW_SELECTABLE_TO_SECTION[target];
}

export function previewTargetForSection(
  section: MenuEditorSectionId
): MenuPreviewSelectable | null {
  const canonical = resolveEditorPanelSection(section);
  return SECTION_TO_PREVIEW[canonical] ?? null;
}
