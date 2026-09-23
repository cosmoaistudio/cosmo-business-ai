/**
 * Menu editor chrome — section nav, viewport, zoom, selection targets.
 * Does not replace MenuTheme / template resolution.
 */

export type MenuEditorSectionId =
  | "identity"
  | "style"
  | "colors"
  | "typography"
  | "layout"
  | "products"
  | "categories"
  | "banner"
  | "buttons"
  | "checkout"
  | "advanced"
  /** @deprecated aliases kept for MenuThemeEditor adapter */
  | "appearance"
  | "catalog"
  | "copy"
  | "features"
  | "template";

export type MenuEditorViewport = "mobile" | "tablet" | "desktop";

export type MenuEditorZoom = 50 | 75 | 100;

export type MenuEditorColorMode = "light" | "dark";

/** Clickable regions in the live preview → open the matching panel. */
export type MenuPreviewSelectable =
  | "header"
  | "banner"
  | "search"
  | "categories"
  | "catalog"
  | "card"
  | "highlights"
  | "cartbar"
  | "button"
  | "productsheet"
  | "checkout";

export type MenuPreviewInteraction = "edit" | "view";

export type MenuEditorFrameWidth = 375 | 390 | 430 | 768 | 1024 | 1280 | 1440;

export type MenuEditorNavId =
  | Exclude<
      MenuEditorSectionId,
      "appearance" | "catalog" | "copy" | "features" | "template"
    >
  | "highlights"
  | "cart";

export type MenuEditorNavGroupId =
  | "appearance"
  | "menu"
  | "conversion"
  | "advanced";

export interface MenuEditorNavItem {
  navId: MenuEditorNavId;
  section: Exclude<
    MenuEditorSectionId,
    "appearance" | "catalog" | "copy" | "features" | "template"
  >;
  label: string;
  hint: string;
  preview: MenuPreviewSelectable | null;
}

export interface MenuEditorNavGroup {
  id: MenuEditorNavGroupId;
  label: string;
  items: MenuEditorNavItem[];
}

export const MENU_EDITOR_SECTIONS: Array<{
  id: Exclude<
    MenuEditorSectionId,
    "appearance" | "catalog" | "copy" | "features" | "template"
  >;
  label: string;
}> = [
  { id: "identity", label: "Identidade" },
  { id: "style", label: "Estilo" },
  { id: "colors", label: "Cores" },
  { id: "typography", label: "Tipografia" },
  { id: "layout", label: "Layout" },
  { id: "products", label: "Produtos" },
  { id: "categories", label: "Categorias" },
  { id: "banner", label: "Banner" },
  { id: "buttons", label: "Botões" },
  { id: "checkout", label: "Checkout" },
  { id: "advanced", label: "Avançado" },
];

export const MENU_EDITOR_NAV_GROUPS: MenuEditorNavGroup[] = [
  {
    id: "appearance",
    label: "Aparência",
    items: [
      { navId: "style", section: "style", label: "Template", hint: "Identidade comercial", preview: null },
      { navId: "identity", section: "identity", label: "Identidade", hint: "Nome, logo e CTA", preview: "header" },
      { navId: "colors", section: "colors", label: "Cores", hint: "Paleta da loja", preview: "header" },
      { navId: "typography", section: "typography", label: "Tipografia", hint: "Fontes e escala", preview: "header" },
      { navId: "layout", section: "layout", label: "Layout", hint: "Grade e densidade", preview: "catalog" },
    ],
  },
  {
    id: "menu",
    label: "Menu",
    items: [
      { navId: "products", section: "products", label: "Produtos", hint: "Cards e ficha", preview: "card" },
      { navId: "highlights", section: "products", label: "Destaques", hint: "Seção de destaques", preview: "highlights" },
      { navId: "categories", section: "categories", label: "Categorias", hint: "Navegação do cardápio", preview: "categories" },
      { navId: "banner", section: "banner", label: "Banner", hint: "Capa do cardápio", preview: "banner" },
    ],
  },
  {
    id: "conversion",
    label: "Conversão",
    items: [
      { navId: "buttons", section: "buttons", label: "Botões", hint: "Estilo dos CTAs", preview: "button" },
      { navId: "cart", section: "buttons", label: "Carrinho", hint: "Barra e drawer", preview: "cartbar" },
      { navId: "checkout", section: "checkout", label: "Checkout", hint: "Textos e ficha final", preview: "checkout" },
    ],
  },
  {
    id: "advanced",
    label: "Avançado",
    items: [
      { navId: "advanced", section: "advanced", label: "Avançado", hint: "Restaurar e comportamento", preview: null },
    ],
  },
];

export const MENU_EDITOR_ZOOM_STEPS: MenuEditorZoom[] = [50, 75, 100];

export const MENU_EDITOR_FRAME_WIDTHS: MenuEditorFrameWidth[] = [
  375, 390, 430, 768, 1024, 1280, 1440,
];

/** Normalize legacy section ids → canonical panel routing. */
export function resolveEditorPanelSection(
  section: MenuEditorSectionId
): Exclude<
  MenuEditorSectionId,
  "appearance" | "catalog" | "copy" | "features" | "template"
> {
  switch (section) {
    case "template":
      return "style";
    case "appearance":
      return "layout";
    case "catalog":
      return "products";
    case "copy":
      return "checkout";
    case "features":
      return "advanced";
    case "identity":
    case "style":
    case "colors":
    case "typography":
    case "layout":
    case "products":
    case "categories":
    case "banner":
    case "buttons":
    case "checkout":
    case "advanced":
      return section;
    default:
      return "identity";
  }
}

/** Curated fonts only — never free-form CSS. */
export const MENU_SAFE_FONTS: Array<{
  id: string;
  label: string;
  value: string;
}> = [
  {
    id: "geist",
    label: "Geist",
    value: "'Geist Variable', system-ui, sans-serif",
  },
  {
    id: "system",
    label: "Sistema",
    value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  {
    id: "inter-like",
    label: "Sans neutra",
    value: "ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "georgia",
    label: "Georgia",
    value: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "ui-serif",
    label: "Serif editorial",
    value: "ui-serif, Georgia, Cambria, serif",
  },
  {
    id: "rounded",
    label: "Arredondada",
    value: "ui-rounded, 'Hiragino Maru Gothic ProN', system-ui, sans-serif",
  },
];

export function matchSafeFont(value: string | undefined): string {
  if (!value) return MENU_SAFE_FONTS[0].value;
  const found = MENU_SAFE_FONTS.find(
    (font) => font.value === value || value.includes(font.label)
  );
  return found?.value ?? MENU_SAFE_FONTS[0].value;
}

export function nextZoom(
  current: MenuEditorZoom,
  direction: "in" | "out"
): MenuEditorZoom {
  const idx = MENU_EDITOR_ZOOM_STEPS.indexOf(current);
  if (direction === "in") {
    return MENU_EDITOR_ZOOM_STEPS[
      Math.min(MENU_EDITOR_ZOOM_STEPS.length - 1, idx + 1)
    ];
  }
  return MENU_EDITOR_ZOOM_STEPS[Math.max(0, idx - 1)];
}
