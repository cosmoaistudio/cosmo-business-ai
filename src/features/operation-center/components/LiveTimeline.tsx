import type { TimelineEvent } from "../types/operationCenter";
import {
  formatTimelineDate,
  formatTimelineTime,
} from "../utils/periodUtils";

interface LiveTimelineProps {
  events: TimelineEvent[];
  live?: boolean;
  tvMode?: boolean;
}

const TYPE_ICONS: Record<TimelineEvent["type"], string> = {
  sale: "🛒",
  product: "📦",
  product_paused: "⏸️",
  product_activated: "✅",
  stock: "📊",
  stock_critical: "🚨",
  automation: "⚙️",
  customer: "👤",
  audit: "📝",
  option: "🧩",
  desktop_connected: "🖥️",
  desktop_disconnected: "🔌",
  print_sent: "🖨️",
  order_delivered: "✅",
};

export default function LiveTimeline({
  events,
  live = false,
  tvMode = false,
}: LiveTimelineProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`font-bold text-white ${tvMode ? "text-2xl" : "text-lg"}`}>
            Timeline {live ? "ao vivo" : "operacional"}
          </h2>
          <p className="text-sm text-slate-400">
            Eventos em tempo real da operação
          </p>
        </div>
        {live && (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
            LIVE
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">
          Aguardando eventos...
        </p>
      ) : (
        <div className="mt-6 max-h-[480px] space-y-3 overflow-y-auto pr-1">
          {events.map((event, index) => {
            const showDate =
              index === 0 ||
              formatTimelineDate(event.timestamp) !==
                formatTimelineDate(events[index - 1].timestamp);

            return (
              <div key={event.id}>
                {showDate && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatTimelineDate(event.timestamp)}
                  </p>
                )}
                <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                  <div className="w-12 shrink-0 text-xs font-semibold text-slate-400">
                    {formatTimelineTime(event.timestamp)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">
                      {TYPE_ICONS[event.type]} {event.label}
                      {event.live && (
                        <span className="ml-2 text-[10px] uppercase text-red-300">
                          live
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
