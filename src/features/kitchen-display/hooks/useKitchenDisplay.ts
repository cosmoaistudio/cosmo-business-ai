import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { subscribePdvKitchenRefresh } from "../integrations/pdv.adapter";
import { subscribeKitchenTickets } from "../repository/kitchenDisplay.repository";
import { kitchenDisplayService } from "../services/kitchenDisplay.service";
import {
  kitchenSettingsService,
  playKitchenNotification,
} from "../services/kitchenSettings.service";
import type {
  KitchenFilterKey,
  KitchenTicket,
} from "../types/kitchenDisplay.types";
import { DEFAULT_KITCHEN_SETTINGS } from "../types/kitchenSettings.types";
import { buildKitchenMetrics } from "../utils/kitchenMetrics";

export function useKitchenDisplay() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? null;

  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<KitchenFilterKey>("all");
  const [settings, setSettings] = useState(DEFAULT_KITCHEN_SETTINGS);
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!organizationId) return;

    try {
      setError(null);
      const data = await kitchenDisplayService.loadTickets(organizationId);

      const incoming = new Set<string>();
      const fresh = new Set<string>();

      for (const ticket of data) {
        incoming.add(ticket.id);
        if (!knownIdsRef.current.has(ticket.id) && ticket.status === "pending") {
          fresh.add(ticket.id);
        }
      }

      knownIdsRef.current = incoming;
      setNewTicketIds(fresh);
      setTickets(data);

      if (fresh.size > 0 && settings.soundEnabled) {
        playKitchenNotification(settings.soundVolume);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar cozinha");
    } finally {
      setLoading(false);
    }
  }, [organizationId, settings.soundEnabled, settings.soundVolume]);

  useEffect(() => {
    setSettings(kitchenSettingsService.load());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!organizationId) return;

    const unsubscribeDb = subscribeKitchenTickets(organizationId, () => {
      void load();
    });

    const unsubscribePdv = subscribePdvKitchenRefresh(() => {
      void load();
    });

    return () => {
      unsubscribeDb();
      unsubscribePdv();
    };
  }, [organizationId, load]);

  useEffect(() => {
    if (!settings.autoRefreshSeconds) return;

    const timer = window.setInterval(() => {
      void load();
    }, settings.autoRefreshSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [load, settings.autoRefreshSeconds]);

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((ticket) => ticket.ticketType === filter);
  }, [filter, tickets]);

  const metrics = useMemo(
    () => buildKitchenMetrics(filteredTickets, settings.maxPrepMinutes),
    [filteredTickets, settings.maxPrepMinutes]
  );

  const advanceTicket = useCallback(
    async (ticket: KitchenTicket) => {
      await kitchenDisplayService.advanceTicket(
        ticket,
        profile?.full_name ?? profile?.role ?? "Cozinha"
      );
      setNewTicketIds((current) => {
        const next = new Set(current);
        next.delete(ticket.id);
        return next;
      });
      await load();
    },
    [load, profile?.full_name, profile?.role]
  );

  const updateSettings = useCallback((patch: Partial<typeof settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      kitchenSettingsService.save(next);
      if (patch.fullscreen !== undefined) {
        void kitchenSettingsService.toggleFullscreen(patch.fullscreen);
      }
      return next;
    });
  }, []);

  return {
    tickets: filteredTickets,
    allTickets: tickets,
    loading,
    error,
    filter,
    setFilter,
    metrics,
    settings,
    updateSettings,
    advanceTicket,
    reload: load,
    newTicketIds,
  };
}
