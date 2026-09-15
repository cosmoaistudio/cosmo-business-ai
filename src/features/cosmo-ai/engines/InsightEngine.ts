import type { CosmoAiAnalysisContext } from "../types/analysisContext";
import type { CosmoInsight } from "../types/cosmoAi";
import type { IRuleBasedAnalyzer } from "../interfaces/llm";
import { generateAllRuleBasedInsights } from "../utils/insightGenerators";
import { sortByPriority } from "../utils/insightScoring";
import { getAllInsightStates } from "../utils/insightStorage";

class RuleBasedAnalyzer implements IRuleBasedAnalyzer {
  analyze(
    context: CosmoAiAnalysisContext,
    weather?: { condition: string; rainProbability: number }
  ): CosmoInsight[] {
    const raw = generateAllRuleBasedInsights(context, weather);
    const states = getAllInsightStates();

    return sortByPriority(
      raw.map((insight) => {
        const stored = states[insight.id];
        if (!stored) return insight;
        return {
          ...insight,
          status: stored.status,
          resolvedAt: stored.status === "resolved" ? stored.timestamp : undefined,
          ignoredAt: stored.status === "ignored" ? stored.timestamp : undefined,
        };
      })
    );
  }
}

export class InsightEngine {
  private analyzer: RuleBasedAnalyzer = new RuleBasedAnalyzer();

  generate(
    context: CosmoAiAnalysisContext,
    weather?: { condition: string; rainProbability: number }
  ): CosmoInsight[] {
    return this.analyzer.analyze(context, weather);
  }

  getActive(insights: CosmoInsight[]): CosmoInsight[] {
    return insights.filter((i) => i.status === "active");
  }

  getAlerts(insights: CosmoInsight[]): CosmoInsight[] {
    return insights.filter(
      (i) =>
        i.status === "active" &&
        (i.type === "alert" || i.type === "urgent")
    );
  }

  getPriorities(insights: CosmoInsight[], limit = 8): CosmoInsight[] {
    return sortByPriority(
      insights.filter((i) => i.status === "active")
    ).slice(0, limit);
  }
}

export const insightEngine = new InsightEngine();
