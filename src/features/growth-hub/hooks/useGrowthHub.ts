import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { growthHubService } from "../services/growthHub.service";
import { ideaGeneratorService } from "../services/ideaGenerator.service";
import type {
  GrowthCalendarView,
  GrowthHubSectionId,
  GrowthHubSnapshot,
  GrowthIdea,
  IdeaGenerationRequest,
} from "../types/growthHub.types";

const DEFAULT_IDEA_REQUEST: IdeaGenerationRequest = {
  niche: "restaurante",
  theme: "",
  objective: "engajar",
  network: "instagram",
  quantity: 5,
};

export function useGrowthHub() {
  const [snapshot, setSnapshot] = useState<GrowthHubSnapshot>(() =>
    growthHubService.getSnapshot()
  );
  const [section, setSection] = useState<GrowthHubSectionId>("overview");
  const [calendarView, setCalendarView] =
    useState<GrowthCalendarView>("month");
  const [ideaRequest, setIdeaRequest] =
    useState<IdeaGenerationRequest>(DEFAULT_IDEA_REQUEST);
  const [generating, setGenerating] = useState(false);

  const overviewStats = useMemo(
    () => [
      {
        id: "marketing",
        label: "Marketing",
        value: String(snapshot.campaigns.length),
        hint: "Campanhas em planejamento",
      },
      {
        id: "content",
        label: "Conteúdo",
        value: String(snapshot.content.length),
        hint: "Peças no pipeline",
      },
      {
        id: "campaigns",
        label: "Campanhas",
        value: String(
          snapshot.campaigns.filter((item) => item.status !== "completed")
            .length
        ),
        hint: "Ativas ou em rascunho",
      },
      {
        id: "traffic",
        label: "Tráfego",
        value: String(snapshot.traffic.length),
        hint: "Canais preparados",
      },
      {
        id: "ai",
        label: "IA",
        value: String(snapshot.aiSlots.length),
        hint: "Slots de geração",
      },
      {
        id: "calendar",
        label: "Calendário",
        value: String(snapshot.calendar.length),
        hint: "Itens agendados",
      },
    ],
    [snapshot]
  );

  const updateIdeaRequest = useCallback(
    (patch: Partial<IdeaGenerationRequest>) => {
      setIdeaRequest((current) => ({ ...current, ...patch }));
    },
    []
  );

  const generateIdeas = useCallback(async () => {
    try {
      setGenerating(true);
      const ideas = await ideaGeneratorService.generateIdeas(ideaRequest);
      setSnapshot((current) => ({
        ...current,
        ideas: [...ideas, ...current.ideas],
      }));
      setSection("ideas");
      toast.success(
        `${ideas.length} ideia(s) geradas. IA real será conectada depois.`
      );
    } catch (error) {
      logger.error("Erro ao gerar ideias do Growth Hub:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar ideias."
      );
    } finally {
      setGenerating(false);
    }
  }, [ideaRequest]);

  const archiveIdea = useCallback((ideaId: string) => {
    setSnapshot((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === ideaId
          ? ({ ...idea, status: "archived" } satisfies GrowthIdea)
          : idea
      ),
    }));
  }, []);

  return {
    snapshot,
    section,
    setSection,
    calendarView,
    setCalendarView,
    ideaRequest,
    updateIdeaRequest,
    generating,
    generateIdeas,
    archiveIdea,
    overviewStats,
  };
}
