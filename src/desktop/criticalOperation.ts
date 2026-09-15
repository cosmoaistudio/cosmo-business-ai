export type CriticalOperationReason = string;

const operations = new Map<string, CriticalOperationReason>();

export function beginCriticalOperation(
  id: string,
  reason = "Há uma operação em andamento. Finalize ou cancele antes de atualizar."
) {
  if (!id) return;
  operations.set(id, reason);
}

export function endCriticalOperation(id: string) {
  if (!id) return;
  operations.delete(id);
}

export function isCriticalOperationActive(): boolean {
  return operations.size > 0;
}

export function getCriticalOperationReason(): string | null {
  const first = operations.values().next();
  return first.done ? null : first.value;
}

export function listCriticalOperations(): string[] {
  return [...operations.keys()];
}

/** Test helper */
export function resetCriticalOperations() {
  operations.clear();
}
