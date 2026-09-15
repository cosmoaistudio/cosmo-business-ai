import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../hooks/useOnboarding";
import OnboardingShell from "./OnboardingShell";
import {
  Step1Company,
  Step2Contact,
} from "./steps/StepCompanyContact";
import {
  Step3Tables,
  Step4Categories,
} from "./steps/StepTablesCategories";
import { Step5Products } from "./steps/StepProducts";
import {
  Step6Printer,
  Step7Kitchen,
  Step9Mobile,
} from "./steps/StepIntegrations";
import {
  Step8DigitalMenu,
  Step10Checklist,
} from "./steps/StepDigitalChecklist";

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const {
    state,
    loading,
    saving,
    progressPercent,
    updateState,
    goToStep,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  if (loading || !state) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">Carregando assistente de configuração...</p>
      </div>
    );
  }

  const handleNext = async () => {
    await nextStep();
    if (state.currentStep === 10) {
      navigate("/");
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <Step1Company state={state} onChange={updateState} />;
      case 2:
        return <Step2Contact state={state} onChange={updateState} />;
      case 3:
        return <Step3Tables state={state} onChange={updateState} />;
      case 4:
        return <Step4Categories state={state} onChange={updateState} />;
      case 5:
        return <Step5Products state={state} onChange={updateState} />;
      case 6:
        return <Step6Printer state={state} onChange={updateState} />;
      case 7:
        return <Step7Kitchen state={state} onChange={updateState} />;
      case 8:
        return <Step8DigitalMenu state={state} onChange={updateState} />;
      case 9:
        return <Step9Mobile state={state} onChange={updateState} />;
      case 10:
        return <Step10Checklist state={state} />;
      default:
        return null;
    }
  };

  return (
    <OnboardingShell
      state={state}
      saving={saving}
      progressPercent={progressPercent}
      onBack={prevStep}
      onNext={() => void handleNext()}
      onSkip={() => {
        skipOnboarding();
        navigate("/");
      }}
      onStepClick={goToStep}
      showSkip={state.currentStep < 10}
      nextLabel={state.currentStep === 5 ? "Criar produtos e continuar" : undefined}
    >
      {renderStep()}
    </OnboardingShell>
  );
}
