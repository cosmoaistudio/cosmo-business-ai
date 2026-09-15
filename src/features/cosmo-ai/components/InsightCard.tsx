import { Link } from "react-router-dom";
import { Check, X, ArrowRight } from "lucide-react";
import type { CosmoInsight } from "../types/cosmoAi";
import {
  INSIGHT_CATEGORY_LABELS,
  INSIGHT_TYPE_LABELS,
} from "../types/cosmoAi";
import InsightScoreBadge from "./InsightScoreBadge";

interface InsightCardProps {
  insight: CosmoInsight;
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
  showActions?: boolean;
}

const TYPE_STYLES: Record<CosmoInsight["type"], string> = {
  urgent: "border-red-300 bg-red-50",
  alert: "border-amber-300 bg-amber-50",
  opportunity: "border-emerald-300 bg-emerald-50",
  suggestion: "border-blue-300 bg-blue-50",
  information: "border-slate-200 bg-slate-50",
};

export default function InsightCard({
  insight,
  onResolve,
  onIgnore,
  showActions = true,
}: InsightCardProps) {
  return (
    <article
      className={`rounded-2xl border p-4 ${TYPE_STYLES[insight.type]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {INSIGHT_CATEGORY_LABELS[insight.category]}
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {INSIGHT_TYPE_LABELS[insight.type]}
            </span>
            <InsightScoreBadge score={insight.score} compact />
          </div>
          <h3 className="mt-2 font-bold text-slate-900">{insight.title}</h3>
          <p className="mt-1 text-sm text-slate-700">{insight.message}</p>
          <InsightScoreBadge score={insight.score} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {insight.href && (
          <Link
            to={insight.href}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            {insight.actionLabel ?? "Ver detalhes"}
            <ArrowRight size={12} />
          </Link>
        )}
        {showActions && onResolve && (
          <button
            type="button"
            onClick={() => onResolve(insight.id)}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700"
          >
            <Check size={12} />
            Resolver
          </button>
        )}
        {showActions && onIgnore && (
          <button
            type="button"
            onClick={() => onIgnore(insight.id)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            <X size={12} />
            Ignorar
          </button>
        )}
      </div>
    </article>
  );
}
