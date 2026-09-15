import { cosmoAiService } from "@/features/cosmo-ai/services/cosmoAi.service";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";

/**
 * Read-only adapters. No business rules changed in source modules.
 */
export async function fetchBusinessBrainSources(organizationId: string | null) {
  const [stats, ai] = await Promise.all([
    dashboardService.getStats(),
    cosmoAiService.analyze(organizationId).catch(() => null),
  ]);

  return { stats, ai };
}
