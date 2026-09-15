import type { OnboardingState } from "../types/onboarding";

const STORAGE_PREFIX = "cosmo:onboarding:";

function storageKey(organizationId: string) {
  return `${STORAGE_PREFIX}${organizationId}`;
}

export function loadOnboardingState(
  organizationId: string,
  organizationName: string
): OnboardingState {
  const defaults = createDefaultOnboardingState(organizationId, organizationName);

  try {
    const raw = localStorage.getItem(storageKey(organizationId));
    if (!raw) return defaults;

    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...defaults,
      ...parsed,
      company: { ...defaults.company, ...parsed.company },
      contact: { ...defaults.contact, ...parsed.contact },
      printer: { ...defaults.printer, ...parsed.printer },
      kitchen: { ...defaults.kitchen, ...parsed.kitchen },
      digitalMenu: { ...defaults.digitalMenu, ...parsed.digitalMenu },
      mobile: { ...defaults.mobile, ...parsed.mobile },
      tables: parsed.tables ?? defaults.tables,
      categories: parsed.categories ?? defaults.categories,
      products: parsed.products ?? defaults.products,
      completedSteps: parsed.completedSteps ?? defaults.completedSteps,
    };
  } catch {
    return defaults;
  }
}

export function saveOnboardingState(state: OnboardingState) {
  const payload: OnboardingState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(storageKey(state.organizationId), JSON.stringify(payload));
}

export function createDefaultOnboardingState(
  organizationId: string,
  organizationName: string
): OnboardingState {
  const slug = organizationName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return {
    organizationId,
    currentStep: 1,
    completedSteps: [],
    completedAt: null,
    company: {
      companyName: organizationName,
      logoUrl: "",
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      segment: "restaurant",
    },
    contact: {
      address: "",
      phone: "",
      whatsapp: "",
      instagram: "",
    },
    tables: [],
    categories: ["Bebidas", "Pratos", "Sobremesas"],
    products: [],
    printer: {
      printerConfigured: false,
      desktopAgentReady: false,
      notes: "",
    },
    kitchen: {
      maxPrepMinutes: 20,
      soundEnabled: true,
      configured: false,
    },
    digitalMenu: {
      slug: slug || "minha-loja",
      qrGenerated: false,
    },
    mobile: {
      mobileConnected: false,
      pairingCode: generatePairingCode(),
    },
    updatedAt: new Date().toISOString(),
  };
}

function generatePairingCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function isOnboardingComplete(state: OnboardingState): boolean {
  return state.completedAt !== null || state.completedSteps.length >= 10;
}

export function getOnboardingProgressPercent(state: OnboardingState): number {
  if (state.completedAt) return 100;
  return Math.round((state.completedSteps.length / 10) * 100);
}
