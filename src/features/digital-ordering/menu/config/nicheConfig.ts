import type {
  DigitalMenuNiche,
  NicheConfig,
  NicheCopy,
  NicheFeatures,
  NicheRules,
  MenuThemeOverrides,
} from "../types/digitalMenu.types";
import { DEFAULT_MENU_THEME } from "../theme/menuTheme";

const BASE_COPY: NicheCopy = {
  searchPlaceholder: "Buscar no cardápio",
  allCategoryLabel: "Tudo",
  highlightsTitle: "Destaques",
  emptyMenuMessage: "Nenhum produto disponível no momento.",
  emptySearchMessage: "Nada encontrado. Tente outro termo.",
  addToCartLabel: "Adicionar",
  viewCartLabel: "Ver carrinho",
  customizableLabel: "Personalizável",
};

const BASE_FEATURES: NicheFeatures = {
  showSearch: true,
  showCategoryTabs: true,
  showHighlights: true,
  showDescriptions: true,
  showProductImages: true,
};

const BASE_RULES: NicheRules = {
  highlightPromotions: true,
  maxHighlights: 6,
};

interface NicheDefinition {
  label: string;
  defaultCategories: string[];
  copy?: Partial<NicheCopy>;
  features?: Partial<NicheFeatures>;
  rules?: Partial<NicheRules>;
  theme?: MenuThemeOverrides;
}

/**
 * Single source of truth per niche. Composition over duplication: every niche
 * renders the same component tree and only overrides copy, features and theme.
 */
const NICHE_DEFINITIONS: Record<DigitalMenuNiche, NicheDefinition> = {
  generic: {
    label: "Geral",
    defaultCategories: [],
  },

  acai: {
    label: "Açaí / Sorveteria",
    defaultCategories: ["Açaí", "Sorvetes", "Cremes", "Adicionais", "Bebidas"],
    copy: {
      searchPlaceholder: "Buscar açaí, cremes, adicionais",
      highlightsTitle: "Mais pedidos",
      customizableLabel: "Monte o seu",
    },
    theme: {
      primaryColor: "#7c3aed",
      secondaryColor: "#5b21b6",
      accentColor: "#c084fc",
      cardRadius: "xl",
    },
  },

  hamburgueria: {
    label: "Hamburgueria",
    defaultCategories: ["Burgers", "Combos", "Acompanhamentos", "Bebidas", "Sobremesas"],
    copy: {
      searchPlaceholder: "Buscar burgers, combos, bebidas",
      highlightsTitle: "Os favoritos da casa",
    },
    theme: {
      primaryColor: "#ea580c",
      secondaryColor: "#9a3412",
      accentColor: "#fb923c",
      cardRadius: "lg",
    },
  },

  pizzaria: {
    label: "Pizzaria",
    defaultCategories: ["Pizzas Salgadas", "Pizzas Doces", "Bordas", "Bebidas", "Sobremesas"],
    copy: {
      searchPlaceholder: "Buscar pizzas, bordas, bebidas",
      highlightsTitle: "Pizzas em destaque",
      customizableLabel: "Escolha os sabores",
    },
    theme: {
      primaryColor: "#dc2626",
      secondaryColor: "#7f1d1d",
      accentColor: "#f87171",
      cardRadius: "lg",
    },
  },

  adega: {
    label: "Adega / Bar",
    defaultCategories: ["Cervejas", "Vinhos", "Destilados", "Drinks", "Petiscos"],
    copy: {
      searchPlaceholder: "Buscar bebidas e petiscos",
      highlightsTitle: "Seleção da casa",
    },
    features: {
      // Bottle catalogs are long and mostly non-customizable.
      showHighlights: false,
    },
    theme: {
      primaryColor: "#0f766e",
      secondaryColor: "#134e4a",
      accentColor: "#5eead4",
      productLayout: "list",
      cardRadius: "md",
      density: "compact",
    },
  },

  restaurante: {
    label: "Restaurante",
    defaultCategories: ["Entradas", "Pratos Principais", "Guarnições", "Bebidas", "Sobremesas"],
    copy: {
      searchPlaceholder: "Buscar pratos e bebidas",
      highlightsTitle: "Sugestões do chef",
    },
    theme: {
      primaryColor: "#b45309",
      secondaryColor: "#78350f",
      accentColor: "#fcd34d",
      cardRadius: "md",
    },
  },

  doceria: {
    label: "Doceria",
    defaultCategories: ["Bolos", "Tortas", "Doces", "Salgados", "Bebidas"],
    copy: {
      searchPlaceholder: "Buscar doces e bolos",
      highlightsTitle: "Doces em destaque",
    },
    theme: {
      primaryColor: "#db2777",
      secondaryColor: "#9d174d",
      accentColor: "#f9a8d4",
      cardRadius: "xl",
    },
  },
};

export const DEFAULT_DIGITAL_MENU_NICHE: DigitalMenuNiche = "generic";

function buildConfig(niche: DigitalMenuNiche): NicheConfig {
  const definition = NICHE_DEFINITIONS[niche];

  return {
    niche,
    label: definition.label,
    defaultCategories: definition.defaultCategories,
    copy: { ...BASE_COPY, ...definition.copy },
    features: { ...BASE_FEATURES, ...definition.features },
    rules: { ...BASE_RULES, ...definition.rules },
    theme: definition.theme ?? {},
  };
}

const CONFIG_CACHE = new Map<DigitalMenuNiche, NicheConfig>();

export function getNicheConfig(niche: DigitalMenuNiche | null | undefined): NicheConfig {
  const resolved = resolveNiche(niche);
  const cached = CONFIG_CACHE.get(resolved);
  if (cached) return cached;

  const config = buildConfig(resolved);
  CONFIG_CACHE.set(resolved, config);
  return config;
}

export function isDigitalMenuNiche(value: unknown): value is DigitalMenuNiche {
  return typeof value === "string" && value in NICHE_DEFINITIONS;
}

/** Accepts persisted/unknown values and never throws. */
export function resolveNiche(value: unknown): DigitalMenuNiche {
  if (isDigitalMenuNiche(value)) return value;
  return DEFAULT_DIGITAL_MENU_NICHE;
}

export function listNiches(): Array<{ niche: DigitalMenuNiche; label: string }> {
  return (Object.keys(NICHE_DEFINITIONS) as DigitalMenuNiche[]).map((niche) => ({
    niche,
    label: NICHE_DEFINITIONS[niche].label,
  }));
}

const TOKEN_KEYS = [
  "cardRadius",
  "buttonRadius",
  "buttonStyle",
  "productLayout",
  "bannerStyle",
  "density",
  "showProductImages",
] as const;

export interface NicheAppearance {
  niche: DigitalMenuNiche;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  menuTheme: MenuThemeOverrides;
}

/**
 * Starting palette when the merchant picks a niche. Identity fields (logo,
 * banner, copy, slug) stay untouched — only visual tokens move.
 */
export function appearanceFromNiche(
  niche: DigitalMenuNiche | null | undefined
): NicheAppearance {
  const config = getNicheConfig(niche);

  return {
    niche: config.niche,
    theme: {
      primaryColor: config.theme.primaryColor ?? DEFAULT_MENU_THEME.primaryColor,
      secondaryColor:
        config.theme.secondaryColor ?? DEFAULT_MENU_THEME.secondaryColor,
      accentColor: config.theme.accentColor ?? DEFAULT_MENU_THEME.accentColor,
      backgroundColor:
        config.theme.backgroundColor ?? DEFAULT_MENU_THEME.backgroundColor,
    },
    menuTheme: Object.fromEntries(
      TOKEN_KEYS.filter((key) => config.theme[key] !== undefined).map((key) => [
        key,
        config.theme[key],
      ])
    ) as MenuThemeOverrides,
  };
}
