import { OnboardingWizard } from "@/features/onboarding";
import PageHeader from "@/components/shared/PageHeader";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração inicial"
        subtitle="Assistente passo a passo para deixar seu negócio pronto para operar."
      />
      <OnboardingWizard />
    </div>
  );
}
