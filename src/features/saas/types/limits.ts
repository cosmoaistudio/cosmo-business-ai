import type { SaasPlanLimits } from "./plans";

export type SaasLimitResource = keyof SaasPlanLimits;

export interface LimitCheckResult {
  resource: SaasLimitResource;
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  planId: string;
  reason?: string;
}

export interface LimitsEngine {
  check(resource: SaasLimitResource, used: number): LimitCheckResult;
  assert(resource: SaasLimitResource, used: number): void;
}
