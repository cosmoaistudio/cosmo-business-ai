import { aiEngine } from "../engines/AIEngine";
import { buildAnalysisContext } from "../repository/cosmoAi.repository";
import type { CosmoAiPanelData } from "../types/cosmoAi";
import {
  resolveInsight,
  ignoreInsight,
} from "../utils/insightStorage";
import { eventBus } from "@/core/event-bus/EventBus";
import { DomainEvents } from "@/core/types/events";

export const cosmoAiService = {
  async analyze(organizationId: string | null): Promise<CosmoAiPanelData> {
    const context = await buildAnalysisContext(organizationId);
    return aiEngine.analyze(context);
  },

  resolveInsight(insightId: string) {
    resolveInsight(insightId);
    eventBus.publish(DomainEvents.InsightResolved, {
      module: "cosmo-ai",
      entityId: insightId,
      entityType: "insight",
      source: "user",
    });
  },

  ignoreInsight(insightId: string) {
    ignoreInsight(insightId);
    eventBus.publish(DomainEvents.InsightIgnored, {
      module: "cosmo-ai",
      entityId: insightId,
      entityType: "insight",
      source: "user",
    });
  },
};
