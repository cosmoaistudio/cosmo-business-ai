import type { OnboardingStepId } from "../types/onboarding";
import {
  ONBOARDING_STEP_LABELS,
  TOTAL_ONBOARDING_STEPS,
} from "../types/onboarding";

interface OnboardingProgressBarProps {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  progressPercent: number;
  onStepClick?: (step: OnboardingStepId) => void;
}

export default function OnboardingProgressBar({
  currentStep,
  completedSteps,
  progressPercent,
  onStepClick,
}: OnboardingProgressBarProps) {
  const steps = Array.from(
    { length: TOTAL_ONBOARDING_STEPS },
    (_, i) => (i + 1) as OnboardingStepId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">
          Etapa {currentStep} de {TOTAL_ONBOARDING_STEPS} —{" "}
          {ONBOARDING_STEP_LABELS[currentStep]}
        </span>
        <span className="font-bold text-blue-600">{progressPercent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="hidden gap-1 sm:grid sm:grid-cols-10">
        {steps.map((step) => {
          const isComplete = completedSteps.includes(step);
          const isCurrent = step === currentStep;

          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepClick?.(step)}
              className={`rounded-lg px-1 py-2 text-center text-[10px] font-semibold transition ${
                isCurrent
                  ? "bg-blue-600 text-white"
                  : isComplete
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              title={ONBOARDING_STEP_LABELS[step]}
            >
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );
}
