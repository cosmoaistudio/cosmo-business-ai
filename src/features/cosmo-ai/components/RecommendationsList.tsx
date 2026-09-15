import { Link } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
import type { CosmoRecommendation } from "../types/cosmoAi";
import { INSIGHT_CATEGORY_LABELS } from "../types/cosmoAi";

interface RecommendationsListProps {
  recommendations: CosmoRecommendation[];
  loading?: boolean;
}

const PRIORITY_STYLES = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-slate-200 bg-slate-50",
};

export default function RecommendationsList({
  recommendations,
  loading,
}: RecommendationsListProps) {
  return (
    <section className="cosmo-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Target className="text-blue-500" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Recomendações</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Ações sugeridas com base nos insights ativos.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Calculando recomendações...</p>
      )}

      {!loading && recommendations.length === 0 && (
        <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Nenhuma recomendação no momento.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {!loading &&
          recommendations.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`block rounded-2xl border p-4 transition hover:shadow-sm ${PRIORITY_STYLES[item.priority]}`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                {INSIGHT_CATEGORY_LABELS[item.category]}
              </div>
              <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                {item.actionLabel}
                <ArrowRight size={14} />
              </p>
            </Link>
          ))}
      </div>
    </section>
  );
}
