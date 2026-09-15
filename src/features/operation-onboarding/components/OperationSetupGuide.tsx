import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Circle,
  Layers,
  Package,
  PartyPopper,
  QrCode,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  OperationSetupStatus,
  OperationSetupStep,
  OperationSetupStepId,
} from "../types";
import "../styles/operation-setup.css";

const STEP_ICONS: Record<OperationSetupStepId, ReactNode> = {
  first_product: <Package size={20} />,
  addons: <Layers size={20} />,
  menu: <UtensilsCrossed size={20} />,
  digital_order: <QrCode size={20} />,
  first_sale: <ShoppingCart size={20} />,
};

interface OperationSetupGuideProps {
  status: OperationSetupStatus;
  loading?: boolean;
}

function OtherStepRow({ step }: { step: OperationSetupStep }) {
  const icon = STEP_ICONS[step.id] ?? <Circle size={16} />;

  const content = (
    <div
      className={`operation-setup__other${
        step.completed
          ? " operation-setup__other--done"
          : " operation-setup__other--upcoming"
      }`}
    >
      <span className="operation-setup__other-marker" aria-hidden>
        {step.completed ? <Check size={14} strokeWidth={3} /> : icon}
      </span>
      <span className="operation-setup__other-label">{step.shortLabel}</span>
      {step.completed ? (
        <span className="operation-setup__other-badge">Concluído</span>
      ) : (
        <span className="operation-setup__other-badge operation-setup__other-badge--muted">
          Em breve
        </span>
      )}
    </div>
  );

  if (step.completed) {
    return <div className="operation-setup__other-wrap">{content}</div>;
  }

  return (
    <Link to={step.href} className="operation-setup__other-wrap">
      {content}
    </Link>
  );
}

function NextStepCard({ step }: { step: OperationSetupStep }) {
  const icon = STEP_ICONS[step.id] ?? <Circle size={20} />;

  return (
    <article className="operation-setup__next">
      <p className="operation-setup__next-eyebrow">Próximo passo</p>
      <div className="operation-setup__next-head">
        <div className="operation-setup__next-icon">{icon}</div>
        <div>
          <h3 className="operation-setup__next-title">{step.title}</h3>
          <p className="operation-setup__next-desc">{step.description}</p>
        </div>
      </div>

      <div className="operation-setup__education">
        <p className="operation-setup__education-label">Para começar</p>
        <ol className="operation-setup__education-list">
          {step.educationSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <p className="operation-setup__tip">
        <strong>Dica:</strong> {step.tip}
      </p>

      <Link to={step.href} className="operation-setup__next-cta">
        {step.ctaLabel}
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}

function CompleteState({ status }: { status: OperationSetupStatus }) {
  return (
    <section className="operation-setup operation-setup--complete">
      <div className="operation-setup__header">
        <div>
          <div className="operation-setup__eyebrow">
            <PartyPopper size={16} />
            <span>Operação pronta</span>
          </div>
          <h2 className="operation-setup__title">
            Sua operação está pronta
          </h2>
          <p className="operation-setup__subtitle">
            Você concluiu os principais passos de configuração. Agora é só
            continuar crescendo.
          </p>
        </div>
        <Link to="/operacoes" className="operation-setup__primary">
          Ver operação
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="operation-setup__progress">
        <div className="operation-setup__progress-meta">
          <span>
            {status.completedSteps} de {status.totalSteps} etapas concluídas
          </span>
          <span>{status.progressPercent}%</span>
        </div>
        <div className="operation-setup__progress-track">
          <div
            className="operation-setup__progress-fill"
            style={{ width: `${status.progressPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export default function OperationSetupGuide({
  status,
  loading,
}: OperationSetupGuideProps) {
  if (loading) return null;

  if (status.allComplete) {
    return <CompleteState status={status} />;
  }

  const nextHref = status.nextStep?.href ?? "/produtos";

  return (
    <section className="operation-setup">
      <div className="operation-setup__header">
        <div>
          <div className="operation-setup__eyebrow">
            <Sparkles size={16} />
            <span>Comece por aqui</span>
          </div>
          <h2 className="operation-setup__title">
            Comece a operar em poucos passos
          </h2>
          <p className="operation-setup__subtitle">
            Seu negócio está criado. Agora vamos preparar sua operação.
          </p>
        </div>

        <Link to={nextHref} className="operation-setup__primary">
          Continuar configuração
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="operation-setup__progress">
        <div className="operation-setup__progress-meta">
          <span>
            {status.completedSteps} de {status.totalSteps} etapas concluídas
          </span>
          <span>{status.progressPercent}%</span>
        </div>
        <div className="operation-setup__progress-track">
          <div
            className="operation-setup__progress-fill"
            style={{ width: `${status.progressPercent}%` }}
          />
        </div>
      </div>

      {status.nextStep ? <NextStepCard step={status.nextStep} /> : null}

      <div className="operation-setup__others">
        <p className="operation-setup__others-label">Outras etapas</p>
        <div className="operation-setup__others-list">
          {status.otherSteps.map((step) => (
            <OtherStepRow key={step.id} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
