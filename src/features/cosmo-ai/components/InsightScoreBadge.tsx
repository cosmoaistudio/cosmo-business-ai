import type { InsightScore } from "../types/cosmoAi";

interface InsightScoreBadgeProps {
  score: InsightScore;
  compact?: boolean;
}

function scoreTone(value: number) {
  if (value >= 75) return "text-red-600 bg-red-50 border-red-200";
  if (value >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

export default function InsightScoreBadge({
  score,
  compact = false,
}: InsightScoreBadgeProps) {
  if (compact) {
    return (
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(score.priority)}`}
      >
        P{score.priority}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-lg bg-violet-50 px-2 py-1 font-medium text-violet-700">
        Impacto {score.impact}
      </span>
      <span className="rounded-lg bg-orange-50 px-2 py-1 font-medium text-orange-700">
        Urgência {score.urgency}
      </span>
      <span className="rounded-lg bg-blue-50 px-2 py-1 font-medium text-blue-700">
        Confiança {score.confidence}%
      </span>
      <span
        className={`rounded-lg border px-2 py-1 font-bold ${scoreTone(score.priority)}`}
      >
        Prioridade {score.priority}
      </span>
    </div>
  );
}
