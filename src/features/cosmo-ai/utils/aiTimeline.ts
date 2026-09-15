import type { CosmoInsight, AiTimelineEvent } from "../types/cosmoAi";
import { getAllInsightStates } from "./insightStorage";

export function buildAiTimeline(insights: CosmoInsight[]): AiTimelineEvent[] {
  const events: AiTimelineEvent[] = [];
  const states = getAllInsightStates();

  for (const insight of insights) {
    events.push({
      id: `tl-created-${insight.id}`,
      type: "insight_created",
      insightId: insight.id,
      title: insight.title,
      description: insight.message,
      timestamp: insight.createdAt,
    });

    const stored = states[insight.id];
    if (stored?.status === "resolved") {
      events.push({
        id: `tl-resolved-${insight.id}`,
        type: "insight_resolved",
        insightId: insight.id,
        title: insight.title,
        description: "Insight marcado como resolvido",
        timestamp: stored.timestamp,
      });
    }

    if (stored?.status === "ignored") {
      events.push({
        id: `tl-ignored-${insight.id}`,
        type: "insight_ignored",
        insightId: insight.id,
        title: insight.title,
        description: "Insight ignorado pelo gerente",
        timestamp: stored.timestamp,
      });
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 40);
}

export function appendTimelineEvent(
  events: AiTimelineEvent[],
  event: AiTimelineEvent
): AiTimelineEvent[] {
  return [event, ...events.filter((e) => e.id !== event.id)].slice(0, 40);
}
