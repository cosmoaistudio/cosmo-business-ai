import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist";

export function OnboardingChecklistPanel() {
  const { steps, completed, total, loading, toggle } = useOnboardingChecklist();

  return (
    <section className="cosmo-saas__panel">
      <h2 className="cosmo-saas__title">Checklist de onboarding</h2>
      <p className="cosmo-saas__desc">
        {loading
          ? "Carregando…"
          : `${completed} de ${total} etapas concluídas`}
      </p>

      <div className="mt-3">
        {steps.map((step) => (
          <div key={step.id} className="cosmo-saas__check">
            <button
              type="button"
              className={
                step.done
                  ? "cosmo-saas__check-box cosmo-saas__check-box--done"
                  : "cosmo-saas__check-box"
              }
              aria-pressed={step.done}
              onClick={() => void toggle({ stepId: step.id, done: !step.done })}
            >
              {step.done ? <Check size={14} /> : null}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  {step.label}
                </span>
                {step.href ? (
                  <Link to={step.href} className="cosmo-saas__link">
                    Abrir
                  </Link>
                ) : null}
              </div>
              <p className="cosmo-saas__desc">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
