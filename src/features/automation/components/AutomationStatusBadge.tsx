import type { AutomationLogStatus } from "../types/automationRule";

interface AutomationStatusBadgeProps {
  enabled?: boolean;
  logStatus?: AutomationLogStatus | null;
}

const LOG_STATUS_STYLES: Record<
  AutomationLogStatus,
  { label: string; className: string }
> = {
  success: {
    label: "Sucesso",
    className: "bg-emerald-100 text-emerald-700",
  },
  failed: {
    label: "Falhou",
    className: "bg-red-100 text-red-700",
  },
  skipped: {
    label: "Ignorada",
    className: "bg-amber-100 text-amber-700",
  },
};

export default function AutomationStatusBadge({
  enabled = true,
  logStatus,
}: AutomationStatusBadgeProps) {
  if (logStatus) {
    const style = LOG_STATUS_STYLES[logStatus];

    return (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}
      >
        {style.label}
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {enabled ? "Ativa" : "Inativa"}
    </span>
  );
}
