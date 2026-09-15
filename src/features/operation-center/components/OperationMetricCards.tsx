import type { OperationMetrics, OperationSummary } from "../types/operationCenter";

interface OperationMetricCardsProps {
  metrics: OperationMetrics;
}

const CARDS: Array<{
  key: keyof OperationMetrics;
  label: string;
  tone: string;
}> = [
  { key: "activeProducts", label: "Produtos ativos", tone: "text-emerald-700" },
  { key: "pausedProducts", label: "Produtos pausados", tone: "text-amber-700" },
  { key: "pausedGroups", label: "Grupos pausados", tone: "text-amber-700" },
  { key: "waitingCustomers", label: "Clientes aguardando", tone: "text-blue-700" },
  { key: "ordersInPrep", label: "Pedidos em preparo", tone: "text-slate-700" },
  { key: "overdueOrders", label: "Pedidos atrasados", tone: "text-red-700" },
  {
    key: "automationsToday",
    label: "Automações hoje",
    tone: "text-violet-700",
  },
  { key: "failuresToday", label: "Falhas hoje", tone: "text-red-700" },
];

export function OperationMetricCards({ metrics }: OperationMetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="cosmo-card p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className={`mt-2 text-3xl font-black ${card.tone}`}>
            {metrics[card.key]}
          </p>
        </div>
      ))}
    </div>
  );
}

export function OperationSummaryBar({ summary }: { summary: OperationSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryPill
        label="Funcionando normalmente"
        value={summary.normal}
        className="border-emerald-200 bg-emerald-50 text-emerald-800"
      />
      <SummaryPill
        label="Em atenção"
        value={summary.attention}
        className="border-amber-200 bg-amber-50 text-amber-900"
      />
      <SummaryPill
        label="Crítico"
        value={summary.critical}
        className="border-red-200 bg-red-50 text-red-800"
      />
    </div>
  );
}

function SummaryPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${className}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}
