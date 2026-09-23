import type {
  DigitalMenuNiche,
  NicheConfig,
  NicheCopy,
  NicheFeatures,
  NicheRules,
  MenuThemeOverrides,
} from "../types/digitalMenu.types";
import { DEFAULT_MENU_THEME } from "../theme/menuTheme";
import { getMenuTemplate } from "../templates/menuTemplateRegistry";
import { templateIdForNiche } from "../templates/resolveMenuTemplate";
import type { MenuTemplateId } from "../types/menuTemplate.types";

const BASE_COPY: NicheCopy = {
  searchPlaceholder: "Buscar no cardápio",
  allCategoryLabel: "Tudo",
  highlightsTitle: "Destaques",
  emptyMenuMessage: "Nenhum produto disponível no momento.",
  emptySearchMessage: "Nada encontrado. Tente outro termo.",
  addToCartLabel: "Adicionar",
  viewCartLabel: "Ver carrinho",
  customizableLabel: "Personalizável",
  catalogTitle: "Cardápio",
  catalogSubtitle: "Faça seu pedido pelo celular",
  cartTitle: "Carrinho",
  checkoutLabel: "Finalizar pedido",
  deliveryLabel: "Delivery",
  pickupLabel: "Retirada",
  paymentTitle: "Pagamento",
  orderSuccessTitle: "Pedido recebido",
};

const BASE_FEATURES: NicheFeatures = {
  showSearch: true,
  showCategoryTabs: true,
  showHighlights: true,
  showDescriptions: true,
  showProductImages: true,
  showPopularBadge: false,
  showPromotions: true,
  showOptionPreview: false,
  showComboSection: false,
  showDelivery: true,
  showPickup: true,
  catalogNavigation: "filter",
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
 * Checkout / DigitalMenuProduct / option_groups stay niche-agnostic.
 */
const NICHE_DEFINITIONS: Record<DigitalMenuNiche, NicheDefinition> = {
  generic: {
    label: "Geral",
    defaultCategories: [],
  },

  acai: {
    label: "Açaí / Sorveteria",
    defaultCategories: [
      "Açaí",
      "Sorvetes",
      "Cremes",
      "Adicionais",
      "Bebidas",
      "Combos",
      "Barcas",
    ],
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

  sorveteria: {
    label: "Sorveteria",
    defaultCategories: ["Sorvetes", "Milk Shakes", "Açaí", "Coberturas", "Bebidas"],
    copy: {
      searchPlaceholder: "Buscar sabores e shakes",
      highlightsTitle: "Sabores em destaque",
      customizableLabel: "Escolha os sabores",
    },
    theme: {
      primaryColor: "#0891b2",
      secondaryColor: "#155e75",
      accentColor: "#67e8f9",
      cardRadius: "xl",
    },
  },

  hamburgueria: {
    label: "Hamburgueria",
    defaultCategories: ["Burgers", "Combos", "Acompanhamentos", "Bebidas", "Sobremesas"],
    copy: {
      searchPlaceholder: "Buscar burgers, combos, bebidas",
      highlightsTitle: "Os favoritos da casa",
      customizableLabel: "Monte o seu",
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

  sushi: {
    label: "Sushi / Japonês",
    defaultCategories: ["Combinados", "Hot Rolls", "Sashimi", "Temaki", "Bebidas"],
    copy: {
      searchPlaceholder: "Buscar combinados e rolls",
      highlightsTitle: "Combinados",
      customizableLabel: "Personalize",
    },
    theme: {
      primaryColor: "#be123c",
      secondaryColor: "#881337",
      accentColor: "#fb7185",
      cardRadius: "md",
      productLayout: "list",
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

  cafeteria: {
    label: "Cafeteria",
    defaultCategories: ["Cafés", "Chás", "Doces", "Salgados", "Bebidas geladas"],
    copy: {
      searchPlaceholder: "Buscar cafés e doces",
      highlightsTitle: "Para acompanhar",
    },
    theme: {
      primaryColor: "#92400e",
      secondaryColor: "#78350f",
      accentColor: "#d6d3d1",
      cardRadius: "lg",
      bannerStyle: "minimal",
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

  lanchonete: {
    label: "Lanchonete",
    defaultCategories: ["Lanches", "Porções", "Bebidas", "Sobremesas"],
    copy: {
      searchPlaceholder: "Buscar lanches e porções",
      highlightsTitle: "Mais pedidos",
    },
    theme: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e3a8a",
      accentColor: "#93c5fd",
      cardRadius: "lg",
    },
  },

  pastelaria: {
    label: "Pastelaria",
    defaultCategories: ["Pastéis", "Salgados", "Sucos", "Bebidas"],
    copy: {
      searchPlaceholder: "Buscar pastéis e salgados",
      highlightsTitle: "Recheios em alta",
      customizableLabel: "Escolha o recheio",
    },
    theme: {
      primaryColor: "#ca8a04",
      secondaryColor: "#854d0e",
      accentColor: "#fde047",
      cardRadius: "lg",
    },
  },

  marmitaria: {
    label: "Marmitaria",
    defaultCategories: ["Marmitas", "Pratos do dia", "Acompanhamentos", "Bebidas"],
    copy: {
      searchPlaceholder: "Buscar marmitas e pratos",
      highlightsTitle: "Pratos do dia",
      customizableLabel: "Monte a marmita",
    },
    theme: {
      primaryColor: "#16a34a",
      secondaryColor: "#14532d",
      accentColor: "#86efac",
      cardRadius: "md",
      productLayout: "list",
    },
  },

  barbearia: {
    label: "Barbearia / Salão",
    defaultCategories: ["Cortes", "Barba", "Combos", "Tratamentos"],
    copy: {
      searchPlaceholder: "Buscar serviços",
      highlightsTitle: "Serviços populares",
      addToCartLabel: "Agendar",
      viewCartLabel: "Ver seleção",
      customizableLabel: "Opções",
      emptyMenuMessage: "Nenhum serviço disponível no momento.",
    },
    features: {
      showHighlights: true,
    },
    theme: {
      primaryColor: "#334155",
      secondaryColor: "#0f172a",
      accentColor: "#94a3b8",
      cardRadius: "md",
      productLayout: "list",
      bannerStyle: "minimal",
      showProductImages: false,
    },
  },

  varejo: {
    label: "Varejo / Loja",
    defaultCategories: ["Novidades", "Promoções", "Mais vendidos"],
    copy: {
      searchPlaceholder: "Buscar produtos",
      highlightsTitle: "Em destaque",
      addToCartLabel: "Adicionar",
      customizableLabel: "Opções",
    },
    features: {
      showHighlights: true,
    },
    theme: {
      primaryColor: "#4f46e5",
      secondaryColor: "#312e81",
      accentColor: "#a5b4fc",
      cardRadius: "md",
      density: "compact",
    },
  },

  servicos: {
    label: "Serviços",
    defaultCategories: ["Serviços", "Pacotes", "Adicionais"],
    copy: {
      searchPlaceholder: "Buscar serviços",
      highlightsTitle: "Mais contratados",
      addToCartLabel: "Selecionar",
      viewCartLabel: "Ver seleção",
      customizableLabel: "Configurar",
      emptyMenuMessage: "Nenhum serviço disponível no momento.",
    },
    theme: {
      primaryColor: "#0369a1",
      secondaryColor: "#0c4a6e",
      accentColor: "#7dd3fc",
      cardRadius: "md",
      productLayout: "list",
      bannerStyle: "minimal",
      showProductImages: false,
    },
  },
};

export const DEFAULT_DIGITAL_MENU_NICHE: DigitalMenuNiche = "generic";

function buildConfig(niche: DigitalMenuNiche): NicheConfig {
  const definition = NICHE_DEFINITIONS[niche];
  const template = getMenuTemplate(templateIdForNiche(niche));

  return {
    niche,
    label: definition.label,
    defaultCategories:
      definition.defaultCategories.length > 0
        ? definition.defaultCategories
        : template.defaultCategories,
    // DEFAULT → template → legacy niche overrides (niche wins on conflict for back-compat)
    copy: {
      ...BASE_COPY,
      ...template.defaults.copy,
      ...definition.copy,
    },
    features: {
      ...BASE_FEATURES,
      ...template.defaults.features,
      ...definition.features,
    },
    rules: { ...BASE_RULES, ...definition.rules },
    theme: {
      ...template.defaults.theme,
      ...(definition.theme ?? {}),
    },
  };
}

/**
 * Resolve niche config optionally enriched by an explicit commercial template.
 * Used when store.menuTemplateId is set (beauty vs services share niche).
 */
export function getNicheConfigForTemplate(
  niche: DigitalMenuNiche | null | undefined,
  templateId?: MenuTemplateId | null
): NicheConfig {
  const base = getNicheConfig(niche);
  if (!templateId) return base;

  const template = getMenuTemplate(templateId);
  return {
    ...base,
    niche: template.niche,
    label: template.name,
    defaultCategories:
      template.defaultCategories.length > 0
        ? template.defaultCategories
        : base.defaultCategories,
    copy: { ...BASE_COPY, ...template.defaults.copy },
    features: { ...BASE_FEATURES, ...template.defaults.features },
    theme: { ...template.defaults.theme },
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
 * Prefer appearanceFromTemplate for commercial template picker.
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
