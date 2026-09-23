import { DEFAULT_MENU_THEME } from "../theme/menuTheme";
import type { DigitalMenuNiche, MenuThemeOverrides } from "../types/digitalMenu.types";
import type {
  MenuTemplate,
  MenuTemplateAppearance,
  MenuTemplateId,
} from "../types/menuTemplate.types";
import {
  getMenuTemplate,
  listMenuTemplates,
  resolveMenuTemplateId,
  templateBrandSeeds,
} from "./menuTemplateRegistry";

const COMPOSITION_KEYS = [
  "cardRadius",
  "buttonRadius",
  "buttonStyle",
  "buttonHeight",
  "buttonFontWeight",
  "buttonShadow",
  "productLayout",
  "bannerStyle",
  "bannerHeight",
  "bannerOverlay",
  "bannerRadius",
  "density",
  "showProductImages",
  "imageAspect",
  "imageSize",
  "shadowStyle",
  "fontFamily",
  "headingFontFamily",
  "baseFontSize",
  "headingFontWeight",
  "bodyFontWeight",
  "headingScale",
  "contentWidth",
  "catalogColumns",
  "pricePosition",
  "ctaPosition",
  "cardStyle",
  "logoSize",
  "headerAlign",
  "surfaceColor",
  "surfaceElevated",
  "surfaceMuted",
  "textColor",
  "mutedTextColor",
  "borderColor",
] as const;

/** Prefer an explicit template id; otherwise map niche → best commercial template. */
export function templateIdForNiche(
  niche: DigitalMenuNiche | null | undefined
): MenuTemplateId {
  const match = listMenuTemplates().find((entry) => entry.niche === niche);
  // Prefer food/service-specific templates over generic when multiple map to same niche.
  if (niche === "servicos") return "services";
  if (niche === "sorveteria") return "icecream";
  if (niche === "hamburgueria") return "burger";
  if (niche === "pastelaria") return "pastel";
  if (niche === "marmitaria") return "marmita";
  if (niche === "barbearia") return "barbershop";
  return match?.id ?? "generic";
}

export function resolveActiveTemplateId(options: {
  menuTemplateId?: unknown;
  niche?: DigitalMenuNiche | null;
}): MenuTemplateId {
  if (options.menuTemplateId != null) {
    return resolveMenuTemplateId(options.menuTemplateId);
  }
  return templateIdForNiche(options.niche);
}

export function getActiveMenuTemplate(options: {
  menuTemplateId?: unknown;
  niche?: DigitalMenuNiche | null;
}): MenuTemplate {
  return getMenuTemplate(resolveActiveTemplateId(options));
}

function compositionOverrides(theme: MenuThemeOverrides): MenuThemeOverrides {
  return Object.fromEntries(
    COMPOSITION_KEYS.filter((key) => theme[key] !== undefined).map((key) => [
      key,
      theme[key],
    ])
  ) as MenuThemeOverrides;
}

/**
 * Applying a template seeds store draft settings for live preview.
 * Identity (logo, banner message, slug) stays untouched.
 *
 * Precedence after apply:
 * DEFAULT < template defaults < later store edits
 */
export function appearanceFromTemplate(
  templateId: MenuTemplateId | null | undefined
): MenuTemplateAppearance {
  const template = getMenuTemplate(templateId);
  const brand = templateBrandSeeds(template);

  return {
    templateId: template.id,
    niche: template.niche,
    theme: brand,
    menuTheme: compositionOverrides(template.defaults.theme),
    menuCopy: { ...template.defaults.copy },
    menuFeatures: { ...template.defaults.features },
  };
}

/** @deprecated Prefer appearanceFromTemplate — kept for niche selector compatibility. */
export function appearanceFromNicheCompat(niche: DigitalMenuNiche | null | undefined) {
  return appearanceFromTemplate(templateIdForNiche(niche));
}

export function mergeTemplateThemeOverrides(
  template: MenuTemplate,
  storeOverrides: MenuThemeOverrides = {}
): MenuThemeOverrides {
  return {
    ...template.defaults.theme,
    ...storeOverrides,
  };
}

export function resolveTemplateFallbackChain(options: {
  menuTemplateId?: unknown;
  niche?: DigitalMenuNiche | null;
}) {
  const template = getActiveMenuTemplate(options);
  return {
    template,
    engineDefaults: DEFAULT_MENU_THEME,
    templateTheme: template.defaults.theme,
    templateCopy: template.defaults.copy,
    templateFeatures: template.defaults.features,
    capabilities: template.capabilities,
  };
}
