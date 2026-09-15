import type { CosmoInsight, CosmoForecast, CosmoRecommendation } from "../types/cosmoAi";
import type { CosmoAiAnalysisContext } from "../types/analysisContext";

/**
 * Contrato para provedores LLM futuros (OpenAI, Anthropic, local, etc.).
 * Nenhum engine deve importar um SDK de IA diretamente — apenas esta interface.
 */
export interface ILLMProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): Promise<boolean>;
  generateInsights(context: CosmoAiAnalysisContext): Promise<CosmoInsight[]>;
  generateRecommendations(
    context: CosmoAiAnalysisContext,
    insights: CosmoInsight[]
  ): Promise<CosmoRecommendation[]>;
  generateForecasts(context: CosmoAiAnalysisContext): Promise<CosmoForecast[]>;
}

/**
 * Provedor rule-based padrão — funciona offline, sem dependência externa.
 */
export interface IRuleBasedAnalyzer {
  analyze(context: CosmoAiAnalysisContext): CosmoInsight[];
}

export interface IWeatherProvider {
  readonly id: string;
  getTodayForecast(): Promise<{ condition: string; rainProbability: number }>;
}

export interface LLMProviderConfig {
  providerId: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
}
