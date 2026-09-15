import { Link } from "react-router-dom";
import type { CriticalAlert } from "../types/operationCenter";
import { CRITICAL_ALERT_SECTIONS } from "../types/operationCenter";

interface CriticalAlertCardProps {
  alerts: CriticalAlert[];
}

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export default function CriticalAlertCard({ alerts }: CriticalAlertCardProps) {
  const grouped = CRITICAL_ALERT_SECTIONS.map((section) => ({
    ...section,
    items: alerts.filter((alert) => alert.type === section.type),
  })).filter((section) => section.items.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-bold text-emerald-900">
          🚨 Nenhum alerta crítico
        </h2>
        <p className="mt-2 text-sm text-emerald-700">
          Operação dentro do esperado. Apenas itens que exigem atenção aparecem
          aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">🚨 Alertas críticos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Somente o que exige atenção imediata.
        </p>
      </div>

      {grouped.map((section) => (
        <div
          key={section.type}
          className="cosmo-card p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">
            {section.emoji} {section.label}
          </h3>

          <div className="mt-3 space-y-2">
            {section.items.slice(0, 5).map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}

            {section.items.length > 5 && (
              <p className="text-xs text-slate-500">
                + {section.items.length - 5} item(ns)
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertRow({ alert }: { alert: CriticalAlert }) {
  const content = (
    <div
      className={`rounded-2xl border px-4 py-3 ${SEVERITY_STYLES[alert.severity]}`}
    >
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
