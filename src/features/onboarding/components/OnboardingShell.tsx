import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import type { ReactNode } from "react";
import OnboardingProgressBar from "./OnboardingProgressBar";
import type { OnboardingState } from "../types/onboarding";
import {
  ONBOARDING_STEP_DESCRIPTIONS,
  ONBOARDING_STEP_LABELS,
} from "../types/onboarding";
import "../styles/onboarding-wizard.css";

interface OnboardingShellProps {
  state: OnboardingState;
  saving: boolean;
  progressPercent: number;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onStepClick: (step: OnboardingState["currentStep"]) => void;
  nextLabel?: string;
  showSkip?: boolean;
}

export default function OnboardingShell({
  state,
  saving,
  progressPercent,
  children,
  onBack,
  onNext,
  onSkip,
  onStepClick,
  nextLabel = "Continuar",
  showSkip = true,
}: OnboardingShellProps) {
  const isLastStep = state.currentStep === 10;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          Voltar ao dashboard
        </Link>

        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Save size={14} className={saving ? "animate-pulse text-blue-500" : ""} />
          {saving ? "Salvando..." : "Progresso salvo automaticamente"}
        </div>
      </div>

      <div className="onboarding-wizard rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Assistente de Configuração
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {ONBOARDING_STEP_LABELS[state.currentStep]}
          </h1>
          <p className="mt-2 text-slate-500 onboarding-help">
            {ONBOARDING_STEP_DESCRIPTIONS[state.currentStep]}
          </p>
        </div>

        <OnboardingProgressBar
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          progressPercent={progressPercent}
          onStepClick={onStepClick}
        />

        <div className="mt-8">{children}</div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={state.currentStep === 1}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            Anterior
          </button>

          <div className="flex flex-wrap gap-2">
            {showSkip && !isLastStep && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Pular assistente
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              {isLastStep ? "Concluir configuração" : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
