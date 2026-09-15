import { fetchBusinessBrainSources } from "../repository/businessBrain.repository";
import { analyzeBusinessBrain } from "./businessBrainAnalyzer.service";
import { brainAskService } from "./brainAsk.service";
import type {
  BrainAskRequest,
  BusinessBrainSnapshot,
} from "../types/businessBrain.types";

export const businessBrainService = {
  async getSnapshot(organizationId: string | null): Promise<BusinessBrainSnapshot> {
    const { stats, ai } = await fetchBusinessBrainSources(organizationId);
    return analyzeBusinessBrain(stats, ai);
  },

  ask(request: BrainAskRequest) {
    return brainAskService.ask(request);
  },
};
