import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { eventBus } from "@/core/event-bus/EventBus";
import { DomainEvents } from "@/core/types/events";
import { logger } from "@/lib/logger";
import { onDataChanged } from "@/lib/sale-events";
import { useAuth } from "@/features/auth";
import { cosmoAiService } from "../services/cosmoAi.service";
import type { CosmoAiPanelData } from "../types/cosmoAi";
import { appendTimelineEvent } from "../utils/aiTimeline";

export function useCosmoAi() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? null;

  const [data, setData] = useState<CosmoAiPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const result = await cosmoAiService.analyze(organizationId);
      setData(result);
    } catch (error) {
      logger.error("Erro ao analisar operação:", error);
      toast.error("Não foi possível executar análise da IA.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const softAnalyze = useCallback(async () => {
    try {
      setAnalyzing(true);
      const result = await cosmoAiService.analyze(organizationId);
      setData(result);
    } catch {
      // silent refresh
    } finally {
      setAnalyzing(false);
    }
  }, [organizationId]);

  const handleResolve = useCallback(
    (insightId: string) => {
      cosmoAiService.resolveInsight(insightId);
      setData((prev) => {
        if (!prev) return prev;
        const update = (list: typeof prev.insights) =>
          list.filter((i) => i.id !== insightId);
        return {
          ...prev,
          insights: update(prev.insights),
          priorities: update(prev.priorities),
          alerts: update(prev.alerts),
          timeline: appendTimelineEvent(prev.timeline, {
            id: `tl-resolved-${insightId}-${Date.now()}`,
            type: "insight_resolved",
            insightId,
            title: "Insight resolvido",
            description: "Marcado como resolvido pelo gerente",
            timestamp: new Date().toISOString(),
          }),
        };
      });
      toast.success("Insight marcado como resolvido.");
    },
    []
  );

  const handleIgnore = useCallback((insightId: string) => {
    cosmoAiService.ignoreInsight(insightId);
    setData((prev) => {
      if (!prev) return prev;
      const update = (list: typeof prev.insights) =>
        list.filter((i) => i.id !== insightId);
      return {
        ...prev,
        insights: update(prev.insights),
        priorities: update(prev.priorities),
        alerts: update(prev.alerts),
        timeline: appendTimelineEvent(prev.timeline, {
          id: `tl-ignored-${insightId}-${Date.now()}`,
          type: "insight_ignored",
          insightId,
          title: "Insight ignorado",
          description: "Descartado pelo gerente",
          timestamp: new Date().toISOString(),
        }),
      };
    });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    return onDataChanged(softAnalyze);
  }, [softAnalyze]);

  useEffect(() => {
    const unsubscribers = [
      eventBus.subscribe(DomainEvents.SaleCompleted, () => void softAnalyze()),
      eventBus.subscribe(DomainEvents.StockChanged, () => void softAnalyze()),
      eventBus.subscribe(DomainEvents.OrderCreated, () => void softAnalyze()),
      eventBus.subscribe(DomainEvents.OrderCompleted, () => void softAnalyze()),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [softAnalyze]);

  return {
    data,
    loading,
    analyzing,
    reload,
    resolveInsight: handleResolve,
    ignoreInsight: handleIgnore,
  };
}
