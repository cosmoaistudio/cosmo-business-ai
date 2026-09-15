import { Zap } from "lucide-react";
import type { CosmoInsight } from "../types/cosmoAi";
import InsightCard from "./InsightCard";

interface PriorityListProps {
  priorities: CosmoInsight[];
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
  loading?: boolean;
}

export default function PriorityList({
  priorities,
  onResolve,
  onIgnore,
  loading,
}: PriorityListProps) {
  return (
    <section className="cosmo-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Zap className="text-amber-500" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Prioridades</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Ações mais urgentes identificadas pela IA operacional.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Analisando operação...</p>
      )}

      {!loading && priorities.length === 0 && (
        <p className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center text-sm text-emerald-700">
          Operação estável — nenhuma prioridade crítica no momento.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {!loading &&
          priorities.map((insight) => (
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
