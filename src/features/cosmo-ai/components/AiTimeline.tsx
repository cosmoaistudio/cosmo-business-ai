import { Clock, CheckCircle2, EyeOff } from "lucide-react";
import type { AiTimelineEvent, AiTimelineEventType } from "../types/cosmoAi";

interface AiTimelineProps {
  events: AiTimelineEvent[];
  loading?: boolean;
}

const EVENT_ICONS: Record<AiTimelineEventType, typeof Clock> = {
  insight_created: Clock,
  insight_resolved: CheckCircle2,
  insight_ignored: EyeOff,
};

const EVENT_LABELS: Record<AiTimelineEventType, string> = {
  insight_created: "Insight criado",
  insight_resolved: "Insight resolvido",
  insight_ignored: "Insight ignorado",
};

export default function AiTimeline({ events, loading }: AiTimelineProps) {
  return (
    <section className="cosmo-card p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Timeline IA</h2>
      <p className="mt-1 text-sm text-slate-500">
        Histórico de insights gerados, resolvidos e ignorados.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Carregando timeline...</p>
      )}

      {!loading && events.length === 0 && (
        <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Nenhum evento registrado ainda.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {!loading &&
          events.map((event) => {
            const Icon = EVENT_ICONS[event.type];
            return (
              <div
                key={event.id}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
                  <Icon size={16} className="text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-violet-600">
                    {EVENT_LABELS[event.type]}
                  </p>
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-600">{event.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
