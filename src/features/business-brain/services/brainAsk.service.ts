import type {
  BrainAskProvider,
  BrainAskRequest,
  BrainAskResponse,
} from "../types/businessBrain.types";

/**
 * Ask-anything architecture for Business Brain.
 * V1: stub provider. Later: swap without changing UI.
 */
export const stubBrainAskProvider: BrainAskProvider = {
  name: "stub-brain-ask",
  isAvailable: () => true,
  async ask(request: BrainAskRequest): Promise<BrainAskResponse> {
    const question = request.question.trim();
    return {
      status: "pending_provider",
      question,
      answerPreview:
        "Arquitetura pronta. Conecte um provider de IA para responder perguntas como esta com dados reais da operação.",
      provider: "stub-brain-ask",
    };
  },
};

let activeProvider: BrainAskProvider = stubBrainAskProvider;

export const brainAskService = {
  getProvider() {
    return activeProvider;
  },
  setProvider(provider: BrainAskProvider) {
    activeProvider = provider;
  },
  async ask(request: BrainAskRequest) {
    if (!request.question.trim()) {
      throw new Error("Digite uma pergunta para o Business Brain.");
    }
    if (!activeProvider.isAvailable()) {
      throw new Error("Provider de perguntas indisponível.");
    }
    return activeProvider.ask(request);
  },
};
