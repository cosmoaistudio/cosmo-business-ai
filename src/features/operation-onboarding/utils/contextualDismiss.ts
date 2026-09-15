import type { OperationSetupStepId } from "../types";

const DISMISS_PREFIX = "cosmo:op-setup:dismissed:";
const CELEBRATED_PREFIX = "cosmo:op-setup:celebrated:";

function scopeKey(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
) {
  return `${organizationId}:${userId}:${stepId}`;
}

function dismissKey(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
) {
  return `${DISMISS_PREFIX}${scopeKey(organizationId, userId, stepId)}`;
}

function celebratedKey(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
) {
  return `${CELEBRATED_PREFIX}${scopeKey(organizationId, userId, stepId)}`;
}

export function isContextualStepDismissed(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
): boolean {
  if (!organizationId || !userId) return false;
  try {
    return localStorage.getItem(dismissKey(organizationId, userId, stepId)) === "1";
  } catch {
    return false;
  }
}

export function dismissContextualStep(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
): void {
  if (!organizationId || !userId) return;
  try {
    localStorage.setItem(dismissKey(organizationId, userId, stepId), "1");
  } catch {
    // ignore
  }
}

export function clearContextualStepDismiss(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
): void {
  if (!organizationId || !userId) return;
  try {
    localStorage.removeItem(dismissKey(organizationId, userId, stepId));
  } catch {
    // ignore
  }
}

/** Session-scoped: celebration once per step completion in this browser tab. */
export function wasContextualStepCelebrated(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
): boolean {
  if (!organizationId || !userId) return false;
  try {
    return (
      sessionStorage.getItem(celebratedKey(organizationId, userId, stepId)) ===
      "1"
    );
  } catch {
    return false;
  }
}

export function markContextualStepCelebrated(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
): void {
  if (!organizationId || !userId) return;
  try {
    sessionStorage.setItem(celebratedKey(organizationId, userId, stepId), "1");
  } catch {
    // ignore
  }
}

/** Exposed for tests — builds the same key shape used in storage. */
export function buildContextualStorageScope(
  organizationId: string,
  userId: string,
  stepId: OperationSetupStepId
) {
  return scopeKey(organizationId, userId, stepId);
}
