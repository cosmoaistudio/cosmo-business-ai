export type DiagnosticStatus = "ok" | "degraded" | "down" | "unknown";

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
}

export interface DiagnosticsSnapshot {
  checkedAt: string;
  appVersion: string;
  buildMode: string;
  checks: DiagnosticCheck[];
}
