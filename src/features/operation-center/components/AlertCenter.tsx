import { Link } from "react-router-dom";
import type { CriticalAlert } from "../types/operationCenter";
import { CRITICAL_ALERT_SECTIONS } from "../types/operationCenter";

interface AlertCenterProps {
  alerts: CriticalAlert[];
  tvMode?: boolean;
}

const SEVERITY_STYLES = {
  critical: "border-red-400/40 bg-red-500/15 text-red-100",
  warning: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  info: "border-blue-400/40 bg-blue-500/15 text-blue-100",
};

export default function AlertCenter({ alerts, tvMode = false }: AlertCenterProps) {
  const actionable = alerts.filter((a) => a.severity !== "info");
  const grouped = CRITICAL_ALERT_SECTIONS.map((section) => ({
    ...section,
    items: actionable.filter((alert) => alert.type === section.type),
  })).filter((section) => section.items.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-100">
        <h2 className={`font-bold ${tvMode ? "text-2xl" : "text-lg"}`}>
          Alert Center — tudo normal
        </h2>
        <p className="mt-2 text-sm opacity-90">
          Nenhum alerta operacional ativo no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`font-bold text-white ${tvMode ? "text-3xl" : "text-xl"}`}>
          Alert Center
        </h2>
        <p className="text-sm text-slate-400">
          {actionable.length} alerta(s) exigem atenção
        </p>
      </div>

      <div className={`grid gap-4 ${tvMode ? "grid-cols-1 xl:grid-cols-2" : ""}`}>
        {grouped.map((section) => (
          <div
            key={section.type}
            className="rounded-3xl border border-white/10 bg-slate-900/60 p-5"
          >
            <h3 className="font-semibold text-white">
              {section.emoji} {section.label}
            </h3>
            <div className="mt-3 space-y-2">
              {section.items.slice(0, tvMode ? 8 : 4).map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: CriticalAlert }) {
  const content = (
    <div className={`rounded-2xl border px-4 py-3 ${SEVERITY_STYLES[alert.severity]}`}>
      <p className="font-medium">{alert.title}</p>
      <p className="mt-1 text-sm opacity-90">{alert.description}</p>
    </div>
  );

  if (alert.href) {
    return (
      <Link to={alert.href} className="block transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
