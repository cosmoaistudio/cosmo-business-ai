import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { OperationRecommendation } from "../types/operationCenter";

interface RecommendationCardProps {
  recommendations: OperationRecommendation[];
}

const PRIORITY_STYLES = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-slate-200 bg-slate-50",
};

export default function RecommendationCard({
  recommendations,
}: RecommendationCardProps) {
  return (
    <div className="cosmo-card p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Recomendações</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sugestões baseadas em regras da operação — sem IA.
      </p>

      {recommendations.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Nenhuma recomendação no momento.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {recommendations.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`block rounded-2xl border p-4 transition hover:shadow-sm ${PRIORITY_STYLES[item.priority]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    {item.actionLabel}
                    <ArrowRight size={14} />
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
