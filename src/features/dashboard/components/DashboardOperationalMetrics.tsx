import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, ShoppingCart } from "lucide-react";

import { formatCurrency, formatNumber } from "@/lib/format";
import ComparisonBadge from "./ComparisonBadge";
import DashboardPeriodHighlights from "./DashboardPeriodHighlights";
import DashboardPeriodInsights from "./DashboardPeriodInsights";
import DashboardRevenueTrend from "./DashboardRevenueTrend";
import DashboardTopProducts from "./DashboardTopProducts";
import DashboardWeekdayPerformance from "./DashboardWeekdayPerformance";
import {
  DashboardMetricCardSkeleton,
  DashboardListSkeleton,
} from "./DashboardSkeleton";
import { OsPanel } from "./os/OsPanel";
import type {
  DashboardPeriodId,
  DashboardPeriodSnapshot,
  DashboardStats,
} from "../types/dashboard";
import { buildDashboardPeriodInsights } from "../utils/buildDashboardPeriodInsights";
import {
  DASHBOARD_PERIOD_OPTIONS,
  DEFAULT_DASHBOARD_PERIOD,
} from "../utils/dashboardPeriods";

interface DashboardOperationalMetricsProps {
  stats: DashboardStats;
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
}

function PeriodSelector({
  value,
  onChange,
  disabled,
}: {
  value: DashboardPeriodId;
  onChange: (period: DashboardPeriodId) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="dashboard-period-selector"
      role="tablist"
      aria-label="Período de análise"
    >
      {DASHBOARD_PERIOD_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            className={`dashboard-period-selector__btn${
              selected ? " dashboard-period-selector__btn--active" : ""
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

function MetricsCards({ snapshot }: { snapshot: DashboardPeriodSnapshot }) {
  const ticketLabel =
    snapshot.salesCount > 0 ? formatCurrency(snapshot.averageTicket) : "—";

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Faturamento
          </p>
          <ComparisonBadge comparison={snapshot.comparison} />
        </div>
        <p className="mt-2 text-2xl font-bold text-white">
          {formatCurrency(snapshot.revenue)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {snapshot.comparison.hasComparableHistory
            ? snapshot.comparisonHint
            : "Sem histórico para comparação"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Vendas
        </p>
        <p className="mt-2 text-2xl font-bold text-white">
          {formatNumber(snapshot.salesCount)}
        </p>
        <p className="mt-1 text-xs text-slate-500">Vendas concluídas</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Ticket médio
        </p>
        <p className="mt-2 text-2xl font-bold text-white">{ticketLabel}</p>
        <p className="mt-1 text-xs text-slate-500">
          Faturamento ÷ vendas do período
        </p>
      </div>
    </div>
  );
}

export default function DashboardOperationalMetrics({
  stats,
  loading = false,
  error = null,
  onRetry,
}: DashboardOperationalMetricsProps) {
  const [period, setPeriod] = useState<DashboardPeriodId>(
    DEFAULT_DASHBOARD_PERIOD
  );
  const snapshot = stats.periodMetrics[period];
  const hasLoadedData =
    stats.totalSales > 0 ||
    stats.todaySales > 0 ||
    Object.values(stats.periodMetrics).some((item) => item.salesCount > 0) ||
    stats.totalProducts > 0 ||
    stats.activeProducts > 0;

  const insights = useMemo(() => {
    if (error && !hasLoadedData) return [];
    if (loading && !hasLoadedData) return [];
    return buildDashboardPeriodInsights(snapshot);
  }, [snapshot, error, loading, hasLoadedData]);

  if (loading && !hasLoadedData) {
    return (
      <div className="space-y-4">
        <OsPanel title="Operação" description="Carregando métricas reais…">
          <PeriodSelector value={period} onChange={setPeriod} disabled />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <DashboardMetricCardSkeleton />
            <DashboardMetricCardSkeleton />
            <DashboardMetricCardSkeleton />
          </div>
        </OsPanel>
        <OsPanel
          title="Produtos mais vendidos"
          description="Ranking do período."
        >
          <DashboardListSkeleton rows={5} />
        </OsPanel>
      </div>
    );
  }

  if (error && !hasLoadedData) {
    return (
      <OsPanel
        title="Operação"
        description="Resumo com dados reais das vendas concluídas."
      >
        <div className="flex flex-col items-start gap-4 py-2">
          <p className="text-sm text-slate-300">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      </OsPanel>
    );
  }

  const hasSales = snapshot.salesCount > 0;
  const isTodayPeriod = period === "today";

  return (
    <div className="space-y-4">
      <OsPanel
        title="Operação"
        description="Vendas concluídas da organização logada, por período."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>
        }
      >
        {error && (
          <p className="mb-3 text-xs text-amber-300/90">
            {error} Exibindo o último carregamento disponível.
          </p>
        )}

        {!hasSales ? (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-lg font-semibold text-slate-100">
              {isTodayPeriod
                ? "Seu dia está começando 🚀"
                : "Nenhuma venda neste período"}
            </p>
            <p className="text-sm text-slate-400">
              {isTodayPeriod
                ? "Ainda não há vendas registradas hoje."
                : `Não há vendas concluídas em ${snapshot.label.toLowerCase()}.`}
            </p>
            {isTodayPeriod && (
              <Link
                to="/pdv"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                <ShoppingCart size={16} />
                Fazer uma venda
              </Link>
            )}
          </div>
        ) : (
          <MetricsCards snapshot={snapshot} />
        )}
      </OsPanel>

      <DashboardPeriodInsights
        insights={insights}
        periodLabel={snapshot.shortLabel}
      />

      <DashboardTopProducts
        products={snapshot.topProducts}
        totalUnitsSold={snapshot.totalUnitsSold}
        periodLabel={snapshot.shortLabel}
        showPdvCta={isTodayPeriod && !hasSales}
      />

      <DashboardRevenueTrend
        points={snapshot.evolution}
        granularity={snapshot.evolutionGranularity}
        periodLabel={snapshot.shortLabel}
      />

      <DashboardWeekdayPerformance
        points={snapshot.weekdayPerformance}
        periodLabel={snapshot.shortLabel}
      />

      <DashboardPeriodHighlights
        highlights={snapshot.highlights}
        periodLabel={snapshot.shortLabel}
      />
    </div>
  );
}
