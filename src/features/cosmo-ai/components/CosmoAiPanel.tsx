import { RefreshCw, Activity } from "lucide-react";
import { motion } from "framer-motion";

import { CosmoCore } from "@/components/auth-experience/CosmoCore";
import { Button, GlassCard } from "@/design-system";

import type { CosmoAiPanelData } from "../types/cosmoAi";
import PriorityList from "./PriorityList";
import InsightsList from "./InsightsList";
import AlertsList from "./AlertsList";
import RecommendationsList from "./RecommendationsList";
import ForecastsPanel from "./ForecastsPanel";
import AiTimeline from "./AiTimeline";

interface CosmoAiPanelProps {
  data: CosmoAiPanelData | null;
  loading: boolean;
  analyzing: boolean;
  onReload: () => void;
  onResolve: (id: string) => void;
  onIgnore: (id: string) => void;
}

function healthColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export default function CosmoAiPanel({
  data,
  loading,
  analyzing,
  onReload,
  onResolve,
  onIgnore,
}: CosmoAiPanelProps) {
  const topInsight = data?.insights[0];

  return (
    <div className="space-y-6">
      <GlassCard padding="lg" className="cosmo-ai-official overflow-hidden">
        <div className="cosmo-ai-official__rings" aria-hidden>
          <div className="cosmo-ai-official__ring" />
          <div className="cosmo-ai-official__ring" />
          <div className="cosmo-ai-official__ring" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <CosmoCore size={100} interactive={false} introComplete />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300/80">
              Cosmo AI
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Seu gerente inteligente
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Observa vendas, pedidos, estoque, cozinha e financeiro em tempo
              real — e sugere ações para faturar mais.
            </p>
            {topInsight && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100"
              >
                {topInsight.message}
              </motion.div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 lg:items-end">
            {data && (
              <div className="text-center lg:text-right">
                <p className="text-xs text-slate-400">Índice operacional</p>
                <p
                  className={`text-3xl font-bold ${healthColor(data.healthIndex)}`}
                >
                  {data.healthIndex}
                </p>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onReload}
              disabled={loading || analyzing}
            >
              <RefreshCw
                size={16}
                className={analyzing ? "animate-spin" : undefined}
              />
              {analyzing ? "Analisando..." : "Reanalisar"}
            </Button>
          </div>
        </div>

        {data && (
          <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Prioridades", value: data.priorities.length },
              { label: "Insights", value: data.insights.length },
              { label: "Alertas", value: data.alerts.length },
              { label: "Recomendações", value: data.recommendations.length },
              { label: "Anomalias", value: data.anomalies.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center"
              >
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="relative mt-6 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-amber-100">
                Chat conversacional
              </p>
              <p className="mt-0.5 text-xs text-amber-100/70">
                Em breve. Hoje o Cosmo age como gerente operacional com
                prioridades, insights e ações — sem chat.
              </p>
            </div>
            <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-amber-100">
              Em breve
            </span>
          </div>
        </div>
      </GlassCard>

      {analyzing && !loading && (
        <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
          <Activity size={16} className="animate-pulse" />
          IA reanalisando operação em tempo real...
        </div>
      )}

      <PriorityList
        priorities={data?.priorities ?? []}
        onResolve={onResolve}
        onIgnore={onIgnore}
        loading={loading}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AlertsList
          alerts={data?.alerts ?? []}
          onResolve={onResolve}
          onIgnore={onIgnore}
          loading={loading}
        />
        <InsightsList
          insights={data?.insights ?? []}
          onResolve={onResolve}
          onIgnore={onIgnore}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecommendationsList
          recommendations={data?.recommendations ?? []}
          loading={loading}
        />
        <ForecastsPanel forecasts={data?.forecasts ?? []} loading={loading} />
      </div>

      <AiTimeline events={data?.timeline ?? []} loading={loading} />
    </div>
  );
}
