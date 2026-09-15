import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { companyOnboardingService } from "../services/companyOnboarding.service";
import {
  EMPTY_COMPANY_ONBOARDING,
  validateCompanyOnboardingStep,
  type CompanyOnboardingForm,
  type CompanyOnboardingStep,
} from "../types";

export function useCompanyOnboarding() {
  const navigate = useNavigate();
  const { profile, reloadProfile, signOut } = useAuth();
  const [step, setStep] = useState<CompanyOnboardingStep>(1);
  const [form, setForm] = useState<CompanyOnboardingForm>(() => ({
    ...EMPTY_COMPANY_ONBOARDING,
    name:
      profile?.organizations?.name &&
      profile.organizations.name !== "Minha Empresa"
        ? profile.organizations.name
        : "",
    businessType: profile?.organizations?.business_type ?? "",
    segment: profile?.organizations?.segment ?? "",
    city: profile?.organizations?.city ?? "",
    whatsapp: profile?.organizations?.whatsapp ?? "",
    logoUrl: profile?.organizations?.logo_url ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingLock = useRef(false);

  const patchForm = useCallback((patch: Partial<CompanyOnboardingForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  }, []);

  const goNext = useCallback(() => {
    const validation = validateCompanyOnboardingStep(step, form);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setStep((s) => (s < 3 ? ((s + 1) as CompanyOnboardingStep) : s));
  }, [form, step]);

  const goBack = useCallback(() => {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as CompanyOnboardingStep) : s));
  }, []);

  const submit = useCallback(async () => {
    if (submittingLock.current) return;

    for (const s of [1, 2, 3] as const) {
      const validation = validateCompanyOnboardingStep(s, form);
      if (validation) {
        setStep(s);
        setError(validation);
        return;
      }
    }

    submittingLock.current = true;
    setSubmitting(true);
    setError(null);

    try {
      await companyOnboardingService.complete(form);
      await reloadProfile();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o negócio. Tente novamente."
      );
    } finally {
      setSubmitting(false);
      submittingLock.current = false;
    }
  }, [form, navigate, reloadProfile]);

  return {
    step,
    form,
    error,
    submitting,
    patchForm,
    goNext,
    goBack,
    submit,
    signOut,
  };
}
