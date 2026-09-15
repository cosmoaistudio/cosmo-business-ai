import { Link } from "react-router-dom";
import { Bot, Sparkles } from "lucide-react";
import { useCosmoAi } from "@/features/cosmo-ai";
import type { OperationCenterData } from "../../types/operationCenter";
import RecommendationCard from "../RecommendationCard";
import InsightCard from "@/features/cosmo-ai/components/InsightCard";

interface AiScreenProps {
  data: OperationCenterData;
}

export default function AiScreen({ data }: AiScreenProps) {
  const { data: aiData, loading, resolveInsight, ignoreInsight } = useCosmoAi();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-950/80 to-slate-950 p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-violet-500/20 p-3">
            <Sparkles className="h-8 w-8 text-violet-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Cosmo AI Manager</h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Gerente operacional inteligente integrado ao Operation Center.
              Índice IA: {aiData?.healthIndex ?? "—"} ·{" "}
              {aiData?.alerts.length ?? 0} alerta(s) ativo(s).
            </p>
            <Link
              to="/ia"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Bot className="h-4 w-4" />
              Abrir painel completo
            </Link>
          </div>
        </div>
      </div>

      {!loading && aiData && aiData.priorities.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white">Prioridades IA</h3>
          {aiData.priorities.slice(0, 3).map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onResolve={resolveInsight}
              onIgnore={ignoreInsight}
            />
          ))}
        </div>
      )}

      <RecommendationCard recommendations={data.recommendations} />

      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <h3 className="font-bold text-white">Automações hoje</h3>
        <p className="mt-2 text-3xl font-black text-violet-200">
          {data.metrics.automationsToday}
        </p>
        <p className="text-sm text-slate-400">
          {data.metrics.failuresToday} falha(s) ·{" "}
          {aiData?.anomalies.length ?? 0} anomalia(s) detectada(s)
        </p>
      </div>
    </div>
  );
}
