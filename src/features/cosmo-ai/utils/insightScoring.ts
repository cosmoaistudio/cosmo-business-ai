import type { InsightCategory, InsightScore, InsightType } from "../types/cosmoAi";

const TYPE_URGENCY: Record<InsightType, number> = {
  urgent: 95,
  alert: 75,
  opportunity: 55,
  suggestion: 40,
  information: 25,
};

const CATEGORY_IMPACT: Record<InsightCategory, number> = {
  operation: 85,
  finance: 80,
  stock: 75,
  customers: 65,
  products: 70,
  marketing: 55,
  team: 50,
};

export function computeInsightScore(input: {
  category: InsightCategory;
  type: InsightType;
  impactOverride?: number;
  urgencyOverride?: number;
  confidence: number;
}): InsightScore {
  const impact = input.impactOverride ?? CATEGORY_IMPACT[input.category];
  const urgency = input.urgencyOverride ?? TYPE_URGENCY[input.type];
  const confidence = Math.max(0, Math.min(100, input.confidence));

  const priority = Math.round(
    impact * 0.35 + urgency * 0.4 + confidence * 0.25
  );

  return {
    impact: Math.round(impact),
    urgency: Math.round(urgency),
    confidence: Math.round(confidence),
    priority: Math.max(0, Math.min(100, priority)),
  };
}

export function sortByPriority<T extends { score: InsightScore }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score.priority - a.score.priority);
}
