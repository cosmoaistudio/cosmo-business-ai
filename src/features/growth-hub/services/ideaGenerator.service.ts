import type {
  GrowthIdea,
  IdeaGenerationRequest,
} from "../types/growthHub.types";

/**
 * Idea generation architecture.
 * Today: deterministic local stubs from the request contract.
 * Later: swap `generateIdeas` body for an LLM provider without changing UI.
 */
export interface IdeaGeneratorProvider {
  readonly name: string;
  readonly isAvailable: () => boolean;
  generate(request: IdeaGenerationRequest): Promise<GrowthIdea[]>;
}

function clampQuantity(quantity: number) {
  return Math.min(20, Math.max(1, Math.round(quantity)));
}

function buildStubTitle(
  request: IdeaGenerationRequest,
  index: number
): string {
  const theme = request.theme.trim() || "novidade da semana";
  return `${index + 1}. ${theme} — ângulo ${request.objective}`;
}

/** Local provider used until real AI is connected. */
export const localIdeaGeneratorProvider: IdeaGeneratorProvider = {
  name: "local-stub",
  isAvailable: () => true,
  async generate(request) {
    const quantity = clampQuantity(request.quantity);
    const now = Date.now();

    return Array.from({ length: quantity }, (_, index) => ({
      id: `idea-${now}-${index}`,
      title: buildStubTitle(request, index),
      hook: `Gancho pronto para ${request.network}: explore “${request.theme.trim() || "sua oferta"}” com foco em ${request.objective}.`,
      niche: request.niche,
      theme: request.theme.trim() || "tema livre",
      objective: request.objective,
      network: request.network,
      status: "ready" as const,
      createdAt: new Date(now + index).toISOString(),
      source: "ai_pending" as const,
    }));
  },
};

let activeProvider: IdeaGeneratorProvider = localIdeaGeneratorProvider;

export const ideaGeneratorService = {
  getProvider() {
    return activeProvider;
  },

  /** Swap provider when LLM is ready — UI keeps the same contract. */
  setProvider(provider: IdeaGeneratorProvider) {
    activeProvider = provider;
  },

  async generateIdeas(request: IdeaGenerationRequest): Promise<GrowthIdea[]> {
    if (!request.theme.trim()) {
      throw new Error("Informe um tema para gerar ideias.");
    }
    if (!activeProvider.isAvailable()) {
      throw new Error("Gerador de ideias indisponível no momento.");
    }
    return activeProvider.generate({
      ...request,
      quantity: clampQuantity(request.quantity),
    });
  },
};
