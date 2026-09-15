import {
  GROWTH_AI_SLOTS,
  PAID_TRAFFIC_CHANNELS,
} from "../constants/growthHub.constants";
import type { GrowthHubSnapshot } from "../types/growthHub.types";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

/** In-memory seed snapshot — no Supabase in V1. */
export function createEmptyGrowthHubSnapshot(): GrowthHubSnapshot {
  return {
    ideas: [],
    calendar: [
      {
        id: "cal-1",
        title: "Bastidores do preparo",
        network: "instagram",
        status: "scheduled",
        scheduledAt: daysFromNow(1),
      },
      {
        id: "cal-2",
        title: "Oferta da semana",
        network: "whatsapp",
        status: "draft",
        scheduledAt: daysFromNow(2),
      },
      {
        id: "cal-3",
        title: "Depoimento de cliente",
        network: "tiktok",
        status: "idea",
        scheduledAt: daysFromNow(4),
      },
    ],
    content: [
      {
        id: "cnt-1",
        title: "Carrossel: por que escolher você",
        network: "instagram",
        status: "draft",
        format: "Carrossel",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cnt-2",
        title: "Reels: 15s de tentação",
        network: "tiktok",
        status: "idea",
        format: "Vídeo curto",
        updatedAt: new Date().toISOString(),
      },
    ],
    campaigns: [
      {
        id: "cmp-1",
        name: "Lançamento do mês",
        objective: "converter",
        status: "draft",
        networks: ["instagram", "whatsapp"],
      },
    ],
    traffic: PAID_TRAFFIC_CHANNELS,
    metrics: [
      {
        id: "m-reach",
        label: "Alcance estimado",
        value: "—",
        hint: "Conecte redes para medir",
        tone: "neutral",
      },
      {
        id: "m-eng",
        label: "Engajamento",
        value: "—",
        hint: "Aguardando integrações",
        tone: "neutral",
      },
      {
        id: "m-leads",
        label: "Leads / conversões",
        value: "—",
        hint: "Campanhas ativas geram dados",
        tone: "warn",
      },
      {
        id: "m-roas",
        label: "ROAS pago",
        value: "—",
        hint: "Meta / Google / TikTok em breve",
        tone: "neutral",
      },
    ],
    automations: [
      {
        id: "auto-1",
        title: "Lembrete de postagem",
        description: "Avisar 1h antes do horário marcado no calendário.",
        status: "planned",
      },
      {
        id: "auto-2",
        title: "Repostar melhor conteúdo",
        description: "Sugerir republicação do post com maior engajamento.",
        status: "ready_soon",
      },
    ],
    aiSlots: GROWTH_AI_SLOTS,
  };
}

export const growthHubService = {
  getSnapshot(): GrowthHubSnapshot {
    return createEmptyGrowthHubSnapshot();
  },
};
