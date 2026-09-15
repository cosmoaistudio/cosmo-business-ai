import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, PartyPopper, X } from "lucide-react";
import type { ReactNode } from "react";
import type { ContextualPresentation } from "../utils/resolveContextualPresentation";
import { CONTEXTUAL_SUCCESS_COPY } from "../utils/resolveContextualPresentation";
import "../styles/contextual-setup.css";

interface ContextualSetupBannerProps {
  presentation: ContextualPresentation;
  icon?: ReactNode;
  /** Override pending CTA label */
  ctaLabel?: string;
  onPrimaryAction?: () => void;
  onDismiss: () => void;
  onAcknowledgeSuccess?: () => void;
  /** When success CTA should run a local action instead of Link */
  onSuccessContinue?: () => void;
}

export default function ContextualSetupBanner({
  presentation,
  icon,
  ctaLabel,
  onPrimaryAction,
  onDismiss,
  onAcknowledgeSuccess,
  onSuccessContinue,
}: ContextualSetupBannerProps) {
  if (presentation.type === "none") return null;

  if (presentation.type === "success") {
    const copy = CONTEXTUAL_SUCCESS_COPY[presentation.completedStep.id];
    const next = presentation.nextStep;
    const continueHref = presentation.allComplete
      ? "/operacoes"
      : next?.href ?? "/";
    const continueLabel = presentation.allComplete
      ? "Ver minha operação"
      : next?.ctaLabel ?? "Continuar configuração";

    const handleContinue = () => {
      onAcknowledgeSuccess?.();
      onSuccessContinue?.();
    };

    return (
      <aside className="contextual-setup contextual-setup--success" role="status">
        <button
          type="button"
          className="contextual-setup__close"
          aria-label="Fechar"
          onClick={() => {
            onAcknowledgeSuccess?.();
            onDismiss();
          }}
        >
          <X size={16} />
        </button>

        <div className="contextual-setup__eyebrow">
          <PartyPopper size={14} />
          <span>Etapa concluída</span>
        </div>

        <h3 className="contextual-setup__title">{copy.title}</h3>
        <p className="contextual-setup__desc">{copy.description}</p>

        {onSuccessContinue ? (
          <button
            type="button"
            className="contextual-setup__cta"
            onClick={handleContinue}
          >
            {continueLabel}
            <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            to={continueHref}
            className="contextual-setup__cta"
            onClick={() => onAcknowledgeSuccess?.()}
          >
            {continueLabel}
            <ArrowRight size={16} />
          </Link>
        )}
      </aside>
    );
  }

  const { step } = presentation;
  const label = ctaLabel ?? step.ctaLabel;

  return (
    <aside className="contextual-setup" aria-label="Guia contextual">
      <button
        type="button"
        className="contextual-setup__close"
        aria-label="Dispensar guia"
        onClick={onDismiss}
      >
        <X size={16} />
      </button>

      <div className="contextual-setup__eyebrow">
        <span>Comece por aqui</span>
      </div>

      <div className="contextual-setup__head">
        {icon ? <div className="contextual-setup__icon">{icon}</div> : null}
        <div>
          <h3 className="contextual-setup__title">{step.title}</h3>
          <p className="contextual-setup__desc">{step.description}</p>
        </div>
      </div>

      <ol className="contextual-setup__steps">
        {step.educationSteps.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      <p className="contextual-setup__tip">
        <Lightbulb size={14} />
        <span>{step.tip}</span>
      </p>

      {onPrimaryAction ? (
        <button
          type="button"
          className="contextual-setup__cta"
          onClick={onPrimaryAction}
        >
          {label}
          <ArrowRight size={16} />
        </button>
      ) : (
        <Link to={step.href} className="contextual-setup__cta">
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </aside>
  );
}
