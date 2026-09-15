import { supabase } from "@/config/supabase";
import type { CompanyOnboardingForm } from "../types";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Não foi possível salvar o negócio. Tente novamente.";
}

export const companyOnboardingService = {
  async complete(form: CompanyOnboardingForm) {
    const payload = {
      p_name: form.name.trim(),
      p_business_type: form.businessType.trim(),
      p_segment: form.segment.trim(),
      p_city: form.city.trim() || null,
      p_whatsapp: form.whatsapp.trim() || null,
      p_logo_url: form.logoUrl.trim() || null,
    };

    const { data, error } = await supabase.rpc(
      "complete_company_onboarding",
      payload
    );

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return data as {
      ok?: boolean;
      organization_id?: string;
      onboarding_completed?: boolean;
    };
  },
};
