import type { TimelineEvent } from "../types/operationCenter";
import LiveTimeline from "./LiveTimeline";

interface TimelineCardProps {
  events: TimelineEvent[];
  loading?: boolean;
}

export default function TimelineCard({
  events,
  loading = false,
}: TimelineCardProps) {
  if (loading) {
    return (
      <div className="cosmo-card p-6 shadow-sm">
        <p className="text-sm text-slate-500">Carregando timeline...</p>
      </div>
    );
  }

  return <LiveTimeline events={events} />;
}
