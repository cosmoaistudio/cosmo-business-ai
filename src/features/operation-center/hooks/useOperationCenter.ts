import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { eventBus } from "@/core/event-bus/EventBus";
import { onDataChanged } from "@/lib/sale-events";
import { useAuth } from "@/features/auth";
import type {
  OperationCenterData,
  OperationPeriod,
  OperationScreen,
  OperationViewMode,
  TimelineEvent,
} from "../types/operationCenter";
import { operationCenterService } from "../services/operationCenter.service";
import {
  domainEventToTimelineEvent,
  subscribeOperationRealtime,
} from "../integrations/realtime.adapter";

const LIVE_TIMELINE_LIMIT = 30;

export function useOperationCenter(initialPeriod: OperationPeriod = "today") {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? null;

  const [period, setPeriod] = useState<OperationPeriod>(initialPeriod);
  const [screen, setScreen] = useState<OperationScreen>("overview");
  const [viewMode, setViewMode] = useState<OperationViewMode>("operational");
  const [data, setData] = useState<OperationCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const liveTimelineRef = useRef<TimelineEvent[]>([]);

  const pushLiveEvent = useCallback((event: TimelineEvent) => {
    liveTimelineRef.current = [
      event,
      ...liveTimelineRef.current.filter((entry) => entry.id !== event.id),
    ].slice(0, LIVE_TIMELINE_LIMIT);
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const result = await operationCenterService.getData(
        { period, organizationId },
        {
          realtimeConnected,
          liveTimeline: liveTimelineRef.current,
        }
      );
      setData(result);
    } catch (error) {
      logger.error("Erro ao carregar centro de operações:", error);
      toast.error("Não foi possível carregar o centro de operações.");
    } finally {
      setLoading(false);
    }
  }, [period, organizationId, realtimeConnected]);

  const softReload = useCallback(async () => {
    try {
      const result = await operationCenterService.getData(
        { period, organizationId },
        {
          realtimeConnected,
          liveTimeline: liveTimelineRef.current,
        }
      );
      setData(result);
    } catch {
      // silent refresh
    }
  }, [period, organizationId, realtimeConnected]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    return onDataChanged(softReload);
  }, [softReload]);

  useEffect(() => {
    const unsubscribe = eventBus.subscribeAll((event) => {
      const mapped = domainEventToTimelineEvent(event);
      if (mapped) {
        pushLiveEvent(mapped);
        void softReload();
      }
    });

    return unsubscribe;
  }, [pushLiveEvent, softReload]);

  useEffect(() => {
    if (!organizationId) return;

    const subscription = subscribeOperationRealtime({
      organizationId,
      onKitchenChange: () => {
        setRealtimeConnected(true);
        void softReload();
      },
      onDesktopChange: () => void softReload(),
      onSaleChange: () => void softReload(),
    });

    setRealtimeConnected(true);

    return () => {
      subscription.unsubscribe();
    };
  }, [organizationId, softReload]);

  return {
    data,
    loading,
    period,
    screen,
    viewMode,
    setPeriod,
    setScreen,
    setViewMode,
    reload,
  };
}
