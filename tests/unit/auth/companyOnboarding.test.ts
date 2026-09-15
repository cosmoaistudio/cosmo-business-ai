import { describe, expect, it } from "vitest";
import {
  validateCompanyOnboardingStep,
  EMPTY_COMPANY_ONBOARDING,
} from "@/features/company-onboarding/types";

describe("company onboarding form", () => {
  it("exige nome, tipo e segmento na etapa 1", () => {
    expect(
      validateCompanyOnboardingStep(1, EMPTY_COMPANY_ONBOARDING)
    ).toMatch(/nome/i);

    expect(
      validateCompanyOnboardingStep(1, {
        ...EMPTY_COMPANY_ONBOARDING,
        name: "Cosmo",
      })
    ).toMatch(/tipo/i);

    expect(
      validateCompanyOnboardingStep(1, {
        ...EMPTY_COMPANY_ONBOARDING,
        name: "Cosmo",
        businessType: "Restaurante",
      })
    ).toMatch(/segmento/i);

    expect(
      validateCompanyOnboardingStep(1, {
        ...EMPTY_COMPANY_ONBOARDING,
        name: "Cosmo",
        businessType: "Restaurante",
        segment: "Fast food",
      })
    ).toBeNull();
  });

  it("etapa 2 e 3 não bloqueiam campos opcionais", () => {
    expect(
      validateCompanyOnboardingStep(2, EMPTY_COMPANY_ONBOARDING)
    ).toBeNull();
    expect(
      validateCompanyOnboardingStep(3, EMPTY_COMPANY_ONBOARDING)
    ).toBeNull();
  });
});
