import type { DigitalMenuNiche } from "../types/digitalMenu.types";
import type { MenuTemplate } from "../types/menuTemplate.types";

function categoryFromNiche(niche: DigitalMenuNiche): string {
  switch (niche) {
    case "barbearia":
    case "servicos":
      return "Serviços";
    case "varejo":
      return "Varejo";
    default:
      return "Alimentação";
  }
}

/**
 * Gallery presentation derived from the registry — never niche if/else in UI.
 */
export function getTemplateGalleryMeta(template: MenuTemplate) {
  return {
    pitch: template.preview.pitch ?? template.description,
    styleLabel: template.preview.styleLabel ?? template.preview.tagline,
    categoryLabel:
      template.preview.categoryLabel ?? categoryFromNiche(template.niche),
    tags: template.preview.tags ?? [],
    density: template.defaults.theme.density ?? "comfortable",
    cardStyle: template.defaults.theme.cardStyle ?? "elevated",
    pricePosition: template.defaults.theme.pricePosition ?? "bottom",
    ctaPosition: template.defaults.theme.ctaPosition ?? "bottom",
  };
}
