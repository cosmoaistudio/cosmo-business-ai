const STORAGE_KEY = "cosmo-ai-insight-states";

interface StoredInsightState {
  status: "resolved" | "ignored";
  timestamp: string;
}

type StoredStates = Record<string, StoredInsightState>;

function readStates(): StoredStates {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredStates) : {};
  } catch {
    return {};
  }
}

function writeStates(states: StoredStates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

export function getInsightState(id: string): StoredInsightState | null {
  return readStates()[id] ?? null;
}

export function resolveInsight(id: string) {
  const states = readStates();
  states[id] = { status: "resolved", timestamp: new Date().toISOString() };
  writeStates(states);
}

export function ignoreInsight(id: string) {
  const states = readStates();
  states[id] = { status: "ignored", timestamp: new Date().toISOString() };
  writeStates(states);
}

export function clearInsightState(id: string) {
  const states = readStates();
  delete states[id];
  writeStates(states);
}

export function getAllInsightStates(): StoredStates {
  return readStates();
}
