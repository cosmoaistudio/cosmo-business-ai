import { TrendingUp } from "lucide-react";
import type { CosmoForecast } from "../types/cosmoAi";
import { INSIGHT_CATEGORY_LABELS } from "../types/cosmoAi";

interface ForecastsPanelProps {
  forecasts: CosmoForecast[];
  loading?: boolean;
}

export default function ForecastsPanel({
  forecasts,
  loading,
}: ForecastsPanelProps) {
  return (
    <section className="cosmo-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="text-cyan-500" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Previsões</h2>
      </div>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Gerando previsões...</p>
      )}

      {!loading && forecasts.length === 0 && (
        <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Dados insuficientes para previsões confiáveis.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {!loading &&
          forecasts.map((forecast) => (
            <div
              key={forecast.id}
              className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-cyan-700">
                  {INSIGHT_CATEGORY_LABELS[forecast.category]}
                </span>
                <span className="text-xs text-slate-500">
                  {forecast.confidence}% confiança
                </span>
              </div>
              <p className="mt-1 font-semibold text-slate-900">
                {forecast.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {forecast.description}
              </p>
              {forecast.valueLabel && (
                <p className="mt-2 text-lg font-black text-cyan-800">
                  {forecast.valueLabel}
                </p>
              )}
            </div>
          ))}
      </div>
    </section>
  );
}
