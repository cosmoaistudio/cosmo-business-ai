import { eventBus } from "@/core/event-bus/EventBus";
import { DomainEvents } from "@/core/types/events";
import { notificationEngine } from "@/core/notification/NotificationEngine";
import type { CosmoInsight } from "../types/cosmoAi";

const notifiedIds = new Set<string>();

export class NotificationEngine {
  async notifyUrgent(insights: CosmoInsight[]): Promise<void> {
    const urgent = insights.filter(
      (i) => i.status === "active" && i.type === "urgent"
    );

    for (const insight of urgent) {
      if (notifiedIds.has(insight.id)) continue;
      notifiedIds.add(insight.id);

      await notificationEngine.send("toast", {
        title: insight.title,
        message: insight.message,
      });

      eventBus.publish(DomainEvents.InsightCreated, {
        module: "cosmo-ai",
        entityId: insight.id,
        entityType: "insight",
        source: "system",
        insightType: insight.type,
        category: insight.category,
      });
    }

    if (notifiedIds.size > 200) {
      notifiedIds.clear();
    }
  }

  clearCache() {
    notifiedIds.clear();
  }
}

export const cosmoNotificationEngine = new NotificationEngine();
