import type { CosmoInsight, CosmoTask } from "../types/cosmoAi";

export class TaskEngine {
  generateFromInsights(insights: CosmoInsight[]): CosmoTask[] {
    const now = new Date().toISOString();

    return insights
      .filter((i) => i.status === "active" && i.type !== "information")
      .slice(0, 10)
      .map((insight) => ({
        id: `task-${insight.id}`,
        insightId: insight.id,
        title: insight.title,
        description: insight.message,
        status: "pending" as const,
        priority:
          insight.type === "urgent"
            ? ("high" as const)
            : insight.type === "alert"
              ? ("high" as const)
              : insight.type === "opportunity"
                ? ("medium" as const)
                : ("low" as const),
        href: insight.href,
        createdAt: now,
      }));
  }

  completeTask(tasks: CosmoTask[], taskId: string): CosmoTask[] {
    return tasks.map((t) =>
      t.id === taskId ? { ...t, status: "completed" as const } : t
    );
  }
}

export const taskEngine = new TaskEngine();
