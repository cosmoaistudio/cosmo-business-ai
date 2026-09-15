import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

import { formatCurrency, formatNumber } from "@/lib/format";

import type { CosmoInsight, CosmoRecommendation } from "@/features/cosmo-ai/types/cosmoAi";
import type { DashboardStats } from "../../types/dashboard";

interface OsHeroProps {
  firstName: string;
  greeting: string;
  stats: DashboardStats;
  healthIndex: number | null;
  nextAction?: CosmoInsight | CosmoRecommendation | null;
  loading?: boolean;
}

function healthTone(score: number) {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}

function operationLine(score: number) {
  if (score >= 80) return "Sua operação está saudável.";
  if (score >= 60) return "Sua operação precisa de atenção.";
  return "Sua operação exige ação imediata.";
}

function healthContext(score: number) {
  if (score >= 80) return "Tudo funcionando normalmente";
  if (score >= 60) return "Há pontos de atenção para hoje";
  return "Priorize as ações críticas agora";
}

function AnimatedScore({ value, loading }: { value: number; loading: boolean }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (loading) return;
    const controls = animate(mv, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, loading, mv]);

  if (loading) return <span>—</span>;
  return <motion.span>{rounded}</motion.span>;
}

export function OsHero({
  firstName,
  greeting,
  stats,
  healthIndex,
  nextAction = null,
  loading = false,
}: OsHeroProps) {
  const revenueDelta = stats.comparisons.revenueTodayVsYesterday;
  const goal = stats.dailyGoal;
  const score = healthIndex ?? 72;
  const goalRemaining = Math.max(0, goal.target - goal.current);
  const alertCount = stats.lowStockCount + stats.outOfStockCount;
  const activeOrdersHint =
    stats.todaySales > 0
      ? `${formatCurrency(stats.todayAverageTicket)} ticket médio`
      : "sem pedidos registrados";

  const nextActionLabel =
    nextAction && "description" in nextAction
      ? nextAction.title
      : nextAction?.title ?? "Revisar operação do dia";

  const nextActionContext =
    nextAction && "description" in nextAction
      ? nextAction.description
      : nextAction?.message ?? "Nenhuma ação urgente no momento";

  const revenueTrendLabel = !revenueDelta.hasComparableHistory
    ? "Sem histórico para comparação"
    : revenueDelta.trend === "up"
      ? "melhor que ontem"
      : revenueDelta.trend === "down"
        ? "abaixo de ontem"
        : "em linha com ontem";

  return (
    <motion.section
      className="cosmo-os-panel cosmo-os-hero cosmo-cc-hero"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cosmo-os-hero__ambient" aria-hidden />

      <div className="cosmo-cc-hero__top">
        <div>
          <p className="cosmo-cc-hero__eyebrow">Centro de Comando</p>
          <h1 className="cosmo-os-hero__greeting">
            {greeting}, {firstName}.
          </h1>
          <p className="cosmo-os-hero__summary">
            {loading ? "Sincronizando o universo operacional..." : operationLine(score)}
          </p>
        </div>

        <div className={`cosmo-cc-status cosmo-cc-status--${healthTone(score)}`}>
          <p className="cosmo-cc-status__label">Status Geral</p>
          <p className="cosmo-cc-status__value">
            <AnimatedScore value={score} loading={loading} />
            <span className="cosmo-cc-status__unit">%</span>
          </p>
          <p className="cosmo-cc-status__hint">{healthContext(score)}</p>
        </div>
      </div>

      <div className="cosmo-cc-today">
        <p className="cosmo-cc-today__label">Hoje você possui</p>
        <div className="cosmo-cc-today__grid">
          <motion.div className="cosmo-cc-tile" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <p className="cosmo-cc-tile__label">Receita prevista</p>
            <p className="cosmo-cc-tile__value">
              {loading ? "—" : formatCurrency(stats.todayRevenue)}
            </p>
            <p
              className={`cosmo-cc-tile__ctx ${
                revenueDelta.hasComparableHistory && revenueDelta.trend === "up"
                  ? "cosmo-cc-tile__ctx--up"
                  : revenueDelta.hasComparableHistory &&
                      revenueDelta.trend === "down"
                    ? "cosmo-cc-tile__ctx--down"
                    : ""
              }`}
            >
              {revenueDelta.hasComparableHistory
                ? `${revenueDelta.changePercent >= 0 ? "▲" : "▼"} ${
                    revenueDelta.changePercent >= 0 ? "+" : ""
                  }${revenueDelta.changePercent.toFixed(0)}% · ${revenueTrendLabel}`
                : revenueTrendLabel}
            </p>
          </motion.div>

          <motion.div className="cosmo-cc-tile" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <p className="cosmo-cc-tile__label">Pedidos ativos</p>
            <p className="cosmo-cc-tile__value">
              {loading ? "—" : formatNumber(stats.todaySales)}
            </p>
            <p className="cosmo-cc-tile__ctx">
              {loading ? "—" : activeOrdersHint}
            </p>
          </motion.div>

          <motion.div className="cosmo-cc-tile" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <p className="cosmo-cc-tile__label">Meta diária</p>
            <p className="cosmo-cc-tile__value">
              {loading ? "—" : `${Math.round(goal.progressPercent)}%`}
            </p>
            <p className="cosmo-cc-tile__ctx">
              {loading
                ? "—"
                : goalRemaining > 0
                  ? `faltam ${formatCurrency(goalRemaining)}`
                  : "meta atingida"}
            </p>
            <div className="cosmo-cc-tile__bar" aria-hidden>
              <motion.div
                className="cosmo-cc-tile__bar-fill"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, Math.max(0, goal.progressPercent))}%`,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>

          <motion.div className="cosmo-cc-tile" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <p className="cosmo-cc-tile__label">Estoque crítico</p>
            <p className="cosmo-cc-tile__value">
              {loading ? "—" : formatNumber(stats.lowStockCount)}
            </p>
            <p
              className={`cosmo-cc-tile__ctx ${
                stats.lowStockCount > 0 ? "cosmo-cc-tile__ctx--warn" : "cosmo-cc-tile__ctx--up"
              }`}
            >
              {stats.lowStockCount > 0 ? "itens para repor" : "níveis estáveis"}
            </p>
          </motion.div>

          <motion.div className="cosmo-cc-tile" whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
            <p className="cosmo-cc-tile__label">Alertas importantes</p>
            <p className="cosmo-cc-tile__value">
              {loading ? "—" : formatNumber(alertCount)}
            </p>
            <p
              className={`cosmo-cc-tile__ctx ${
                alertCount > 0 ? "cosmo-cc-tile__ctx--warn" : "cosmo-cc-tile__ctx--up"
              }`}
            >
              {alertCount > 0 ? "requerem revisão" : "nenhum alerta crítico"}
            </p>
          </motion.div>

          <motion.div
            className="cosmo-cc-tile cosmo-cc-tile--action"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
          >
            <p className="cosmo-cc-tile__label">Próxima ação recomendada</p>
            <p className="cosmo-cc-tile__value cosmo-cc-tile__value--sm">
              {loading ? "—" : nextActionLabel}
            </p>
            <p className="cosmo-cc-tile__ctx">{loading ? "—" : nextActionContext}</p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
