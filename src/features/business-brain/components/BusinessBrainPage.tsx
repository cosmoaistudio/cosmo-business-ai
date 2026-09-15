import { memo, useMemo } from "react";
import { Brain, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import PageHeader from "@/components/shared/PageHeader";

import { useBusinessBrain } from "../hooks/useBusinessBrain";
import { levelLabel } from "../services/businessBrainAnalyzer.service";
import type {
  BrainAlert,
  BrainGoal,
  BrainOpportunity,
  DomainHealth,
  InsightComparison,
  MarketingInsight,
  SmartSummaryItem,
} from "../types/businessBrain.types";
import "../styles/business-brain.css";

const HealthBlock = memo(function HealthBlock({
  domains,
  overallScore,
  overallLevel,
}: {
  domains: DomainHealth[];
  overallScore: number;
  overallLevel: DomainHealth["level"];
}) {
  return (
    <section className="cosmo-brain__panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="cosmo-brain__title">Saúde da empresa</h2>
          <p className="cosmo-brain__desc">
            Leitura consolidada — análise apenas, sem executar ações.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Índice geral
          </p>
          <p
            className={`text-3xl font-bold cosmo-brain__domain-level--${overallLevel}`}
          >
            {overallScore}%
          </p>
          <p className="text-sm text-slate-400">{levelLabel(overallLevel)}</p>
        </div>
      </div>
      <div className="cosmo-brain__domains mt-4">
        {domains.map((domain) => (
          <article key={domain.id} className="cosmo-brain__domain">
            <p className="cosmo-brain__domain-label">{domain.label}</p>
            <p
              className={`cosmo-brain__domain-level cosmo-brain__domain-level--${domain.level}`}
            >
              {levelLabel(domain.level)}
            </p>
            <p className="cosmo-brain__domain-summary">{domain.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
});

const SummaryBlock = memo(function SummaryBlock({
  items,
}: {
  items: SmartSummaryItem[];
}) {
  return (
    <section className="cosmo-brain__panel">
      <h2 className="cosmo-brain__title">Resumo inteligente</h2>
      <p className="cosmo-brain__desc">Sinais do dia em linguagem clara.</p>
      <div className="cosmo-brain__list">
        {items.map((item) => (
          <div
            key={item.id}
            className={`cosmo-brain__item cosmo-brain__tone--${item.tone}`}
          >
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

const OpportunitiesBlock = memo(function OpportunitiesBlock({
  items,
}: {
  items: BrainOpportunity[];
}) {
  return (
    <section className="cosmo-brain__panel">
      <h2 className="cosmo-brain__title">Oportunidades</h2>
      <p className="cosmo-brain__desc">Sugestões para vender e operar melhor.</p>
      <div className="cosmo-brain__list">
        {items.map((item) => (
          <div key={item.id} className="cosmo-brain__item">
            <div className="flex items-center justify-between gap-2">
              <h3>{item.title}</h3>
              <span className={`cosmo-brain__badge cosmo-brain__badge--${item.priority}`}>
                {item.priority}
              </span>
            </div>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

const AlertsBlock = memo(function AlertsBlock({
  items,
}: {
  items: BrainAlert[];
}) {
  return (
    <section className="cosmo-brain__panel">
      <h2 className="cosmo-brain__title">Alertas</h2>
      <p className="cosmo-brain__desc">Pontos que pedem atenção agora.</p>
      <div className="cosmo-brain__list">
        {items.length === 0 ? (
          <div className="cosmo-brain__item cosmo-brain__tone--positive">
            <p>Nenhum alerta crítico no momento.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`cosmo-brain__item cosmo-brain__tone--${
                item.severity === "critical"
                  ? "critical"
                  : item.severity === "warning"
                    ? "warning"
                    : "neutral"
              }`}
            >
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

const InsightsBlock = memo(function InsightsBlock({
  items,
}: {
  items: InsightComparison[];
}) {
  return (
    <section className="cosmo-brain__panel">
      <h2 className="cosmo-brain__title">Insights</h2>
      <p className="cosmo-brain__desc">Comparação Hoje · Ontem · Semana · Mês.</p>
      <div className="cosmo-brain__list">
        {items.map((item) => (
          <div key={item.id} className="cosmo-brain__item">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3>{item.label}</h3>
              <span
                className={
                  item.trend === "up"
                    ? "text-emerald-400 text-sm font-semibold"
                    : item.trend === "down"
                      ? "text-rose-400 text-sm font-semibold"
                      : "text-slate-400 text-sm font-semibold"
                }
              >
                {item.changePercent >= 0 ? "+" : ""}
                {item.changePercent.toFixed(1)}%
              </span>
            </div>
            <p>
              {item.currentLabel}: {item.currentValue} · {item.previousLabel}:{" "}
              {item.previousValue}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});

const GoalsBlock = memo(function GoalsBlock({ items }: { items: BrainGoal[] }) {
  return (
    <section className="cosmo-brain__panel">
      <h2 className="cosmo-brain__title">Metas</h2>
      <p className="cosmo-brain__desc">
        Receita · Pedidos · Lucro · Ticket · Conversão
      </p>
      <div className="cosmo-brain__list">
        {items.map((item) => (
          <div key={item.id} className="cosmo-brain__item">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3>{item.label}</h3>
              <p className="text-sm text-slate-300">
                {item.current} / {item.target}
              </p>
            </div>
            <p>{item.hint}</p>
            <div className="cosmo-brain__progress" aria-hidden>
              <span style={{ width: `${Math.min(100, item.progressPercent)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

const MarketingBlock = memo(function MarketingBlock({
  items,
}: {
  items: MarketingInsight[];
}) {
  return (
    <section className="cosmo-brain__panel">
      <h2 className="cosmo-brain__title">Marketing</h2>
      <p className="cosmo-brain__desc">
        Conteúdo, campanhas, horário e rede social.
      </p>
      <div className="cosmo-brain__list">
        {items.map((item) => (
          <div key={item.id} className="cosmo-brain__item">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p className="mt-1 text-xs text-sky-300/90">
              {[item.network, item.bestTime].filter(Boolean).join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});

export function BusinessBrainPage() {
  const {
    snapshot,
    loading,
    refreshing,
    reload,
    askDraft,
    setAskDraft,
    askResult,
    asking,
    submitQuestion,
  } = useBusinessBrain();

  const headerAction = useMemo(
    () => (
      <button
        type="button"
        className="cosmo-brain__chip inline-flex items-center gap-2"
        onClick={reload}
        disabled={loading || refreshing}
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
        Reanalisar
      </button>
    ),
    [loading, refreshing, reload]
  );

  if (loading && !snapshot) {
    return (
      <div className="cosmo-brain">
        <PageHeader
          title="Business Brain"
          subtitle="Cérebro operacional — interpreta os dados da empresa."
        />
        <div className="cosmo-brain__grid cosmo-brain__grid--main">
          <div className="cosmo-brain__skeleton" />
          <div className="cosmo-brain__skeleton" />
          <div className="cosmo-brain__skeleton" />
          <div className="cosmo-brain__skeleton" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="cosmo-brain">
        <PageHeader
          title="Business Brain"
          subtitle="Não foi possível carregar a análise."
          action={headerAction}
        />
      </div>
    );
  }

  return (
    <div className="cosmo-brain">
      <PageHeader
        title="Business Brain"
        subtitle="Cérebro operacional do Cosmo. Analisa — não executa."
        action={headerAction}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <HealthBlock
          domains={snapshot.domains}
          overallScore={snapshot.overallScore}
          overallLevel={snapshot.overallLevel}
        />
      </motion.div>

      <div className="cosmo-brain__grid cosmo-brain__grid--main">
        <SummaryBlock items={snapshot.summary} />
        <OpportunitiesBlock items={snapshot.opportunities} />
        <AlertsBlock items={snapshot.alerts} />
        <InsightsBlock items={snapshot.insights} />
        <GoalsBlock items={snapshot.goals} />
        <MarketingBlock items={snapshot.marketing} />
      </div>

      <section className="cosmo-brain__panel">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
            <Brain size={18} />
          </div>
          <div>
            <h2 className="cosmo-brain__title">IA — Pergunte qualquer coisa</h2>
            <p className="cosmo-brain__desc">
              Arquitetura pronta. Provider de resposta será conectado depois.
            </p>
          </div>
        </div>

        <div className="cosmo-brain__chips">
          {snapshot.suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="cosmo-brain__chip"
              onClick={() => void submitQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <div className="cosmo-brain__ask">
          <input
            value={askDraft}
            onChange={(event) => setAskDraft(event.target.value)}
            placeholder='Ex.: "Como aumentar minhas vendas?"'
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitQuestion();
            }}
          />
          <button
            type="button"
            disabled={asking}
            onClick={() => void submitQuestion()}
          >
            {asking ? "Enviando..." : "Perguntar"}
          </button>
        </div>

        {askResult ? (
          <div className="cosmo-brain__item cosmo-brain__tone--neutral mt-3">
            <h3>{askResult.question}</h3>
            <p>{askResult.answerPreview}</p>
            <p className="mt-1 text-xs text-amber-200/80">
              Status: {askResult.status} · provider {askResult.provider}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
