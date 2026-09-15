import { getPlanById } from "../catalog/plans.catalog";
import type { LimitCheckResult, SaasLimitResource } from "../types/limits";
import type { SaasPlanId } from "../types/plans";

/**
 * Arquitetura de limites por plano.
 * Não bloqueia módulos existentes nesta sprint — apenas avalia.
 */
export function createLimitsEngine(planId: SaasPlanId) {
  const plan = getPlanById(planId);

  function check(resource: SaasLimitResource, used: number): LimitCheckResult {
    const limit = plan?.limits[resource] ?? null;

    if (limit == null) {
      return {
        resource,
        allowed: true,
        used,
        limit: null,
        remaining: null,
        planId,
      };
    }

    const remaining = Math.max(limit - used, 0);
    const allowed = used < limit;

    return {
      resource,
      allowed,
      used,
      limit,
      remaining,
      planId,
      reason: allowed
        ? undefined
        : `Limite de ${resource} atingido no plano ${plan?.name ?? planId}.`,
    };
  }

  function assert(resource: SaasLimitResource, used: number) {
    const result = check(resource, used);
    if (!result.allowed) {
      throw new Error(result.reason ?? "Limite do plano excedido");
    }
  }

  return { check, assert };
}
