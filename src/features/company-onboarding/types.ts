export const BUSINESS_TYPES = [
  "Restaurante",
  "Lanchonete",
  "Pizzaria",
  "Açaí / Sorveteria",
  "Bar",
  "Loja",
  "Mercado",
  "Serviços",
  "Outro",
] as const;

export type BusinessTypeOption = (typeof BUSINESS_TYPES)[number];

export interface CompanyOnboardingForm {
  name: string;
  businessType: string;
  segment: string;
  city: string;
  whatsapp: string;
  logoUrl: string;
}

export const EMPTY_COMPANY_ONBOARDING: CompanyOnboardingForm = {
  name: "",
  businessType: "",
  segment: "",
  city: "",
  whatsapp: "",
  logoUrl: "",
};

export type CompanyOnboardingStep = 1 | 2 | 3;

export function validateCompanyOnboardingStep(
  step: CompanyOnboardingStep,
  form: CompanyOnboardingForm
): string | null {
  if (step === 1) {
    if (!form.name.trim()) return "Informe o nome da empresa.";
    if (!form.businessType.trim()) return "Selecione o tipo de negócio.";
    if (!form.segment.trim()) return "Informe o segmento.";
  }
  return null;
}
