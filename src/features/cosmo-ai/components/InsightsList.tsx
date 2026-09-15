import { Lightbulb } from "lucide-react";
import type { CosmoInsight } from "../types/cosmoAi";
import InsightCard from "./InsightCard";

interface InsightsListProps {
  insights: CosmoInsight[];
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
  loading?: boolean;
}

export default function InsightsList({
  insights,
  onResolve,
  onIgnore,
  loading,
}: InsightsListProps) {
  return (
    <section className="cosmo-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Lightbulb className="text-violet-500" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Insights</h2>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Gerando insights...</p>
      )}

      {!loading && insights.length === 0 && (
        <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Nenhum insight ativo. A IA continua monitorando a operação.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {!loading &&
          insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onResolve={onResolve}
              onIgnore={onIgnore}
            />
          ))}
      </div>
    </section>
  );
}
