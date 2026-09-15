import type { CosmoInsight, CosmoRecommendation } from "../types/cosmoAi";

const ACTION_MAP: Record<
  string,
  { actionLabel: string; href: string; priority: CosmoRecommendation["priority"] }
> = {
  operation: { actionLabel: "Centro de operações", href: "/operacoes", priority: "high" },
  stock: { actionLabel: "Repor estoque", href: "/estoque", priority: "high" },
  finance: { actionLabel: "Ver financeiro", href: "/financeiro", priority: "medium" },
  marketing: { actionLabel: "Ver produtos", href: "/produtos", priority: "medium" },
  customers: { actionLabel: "Campanha de reativação", href: "/clientes", priority: "low" },
  products: { actionLabel: "Analisar produto", href: "/produtos", priority: "medium" },
  team: { actionLabel: "Ver automações", href: "/automacoes", priority: "medium" },
};

export class RecommendationEngine {
  generate(insights: CosmoInsight[]): CosmoRecommendation[] {
    const active = insights.filter((i) => i.status === "active");

    return active
      .map((insight) => {
        const defaults = ACTION_MAP[insight.category] ?? {
          actionLabel: "Ver detalhes",
          href: "/ia",
          priority: "medium" as const,
        };

        const priority =
          insight.type === "urgent"
            ? "high"
            : insight.type === "alert"
              ? "high"
              : insight.type === "opportunity"
                ? "medium"
                : defaults.priority;

        return {
          id: `rec-${insight.id}`,
          insightId: insight.id,
          title: insight.title,
          description: insight.message,
          actionLabel: insight.actionLabel ?? defaults.actionLabel,
          href: insight.href ?? defaults.href,
          priority,
          category: insight.category,
        };
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      })
      .slice(0, 12);
  }
}

export const recommendationEngine = new RecommendationEngine();
