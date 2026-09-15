export type OnboardingStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type BusinessSegment =
  | "restaurant"
  | "cafe"
  | "bar"
  | "bakery"
  | "food_truck"
  | "retail"
  | "other";

export interface OnboardingCompanyStep {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  segment: BusinessSegment;
}

export interface OnboardingContactStep {
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
}

export interface OnboardingTableDraft {
  id: string;
  label: string;
  seats: number;
}

export interface OnboardingProductDraft {
  id: string;
  name: string;
  category: string;
  price: number;
  created: boolean;
}

export interface OnboardingPrinterStep {
  printerConfigured: boolean;
  desktopAgentReady: boolean;
  notes: string;
}

export interface OnboardingKitchenStep {
  maxPrepMinutes: number;
  soundEnabled: boolean;
  configured: boolean;
}

export interface OnboardingDigitalMenuStep {
  slug: string;
  qrGenerated: boolean;
}

export interface OnboardingMobileStep {
  mobileConnected: boolean;
  pairingCode: string;
}

export interface OnboardingState {
  organizationId: string;
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  completedAt: string | null;
  company: OnboardingCompanyStep;
  contact: OnboardingContactStep;
  tables: OnboardingTableDraft[];
  categories: string[];
  products: OnboardingProductDraft[];
  printer: OnboardingPrinterStep;
  kitchen: OnboardingKitchenStep;
  digitalMenu: OnboardingDigitalMenuStep;
  mobile: OnboardingMobileStep;
  updatedAt: string;
}

export interface WelcomeMilestones {
  firstProduct: boolean;
  firstSale: boolean;
  firstQrCode: boolean;
  firstOrder: boolean;
  onboardingComplete: boolean;
  progressPercent: number;
}

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  1: "Empresa",
  2: "Contato",
  3: "Mesas",
  4: "Categorias",
  5: "Produtos",
  6: "Impressora",
  7: "Cozinha",
  8: "Cardápio Digital",
  9: "Mobile",
  10: "Conclusão",
};

export const ONBOARDING_STEP_DESCRIPTIONS: Record<OnboardingStepId, string> = {
  1: "Nome, logo, cores e segmento do negócio",
  2: "Endereço e canais de contato",
  3: "Mesas para pedido na mesa (opcional)",
  4: "Organize seu cardápio por categorias",
  5: "Cadastre seus primeiros produtos",
  6: "Impressora e Desktop Agent",
  7: "Kitchen Display System",
  8: "Cardápio digital e QR Codes",
  9: "Conectar app mobile",
  10: "Checklist final — sistema pronto",
};

export const BUSINESS_SEGMENT_LABELS: Record<BusinessSegment, string> = {
  restaurant: "Restaurante",
  cafe: "Cafeteria",
  bar: "Bar / Pub",
  bakery: "Padaria / Confeitaria",
  food_truck: "Food Truck",
  retail: "Varejo",
  other: "Outro",
};

export const TOTAL_ONBOARDING_STEPS = 10;
