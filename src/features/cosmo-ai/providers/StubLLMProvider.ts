import type { ILLMProvider } from "../interfaces/llm";
import type { CosmoAiAnalysisContext } from "../types/analysisContext";
import type { CosmoInsight, CosmoForecast, CosmoRecommendation } from "../types/cosmoAi";

/**
 * Provedor stub — retorna vazio até um LLM real ser configurado via setLLMProvider().
 */
export class StubLLMProvider implements ILLMProvider {
  readonly id = "stub";
  readonly name = "Cosmo Rule-Based (sem LLM)";

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async generateInsights(_context: CosmoAiAnalysisContext): Promise<CosmoInsight[]> {
    return [];
  }

  async generateRecommendations(
    _context: CosmoAiAnalysisContext,
    _insights: CosmoInsight[]
  ): Promise<CosmoRecommendation[]> {
    return [];
  }

  async generateForecasts(_context: CosmoAiAnalysisContext): Promise<CosmoForecast[]> {
    return [];
  }
}
