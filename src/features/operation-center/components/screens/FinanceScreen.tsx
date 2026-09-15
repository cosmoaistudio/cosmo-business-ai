import { formatCurrency } from "@/lib/format";
import type { OperationCenterData } from "../../types/operationCenter";
import HealthScorePanel from "../HealthScorePanel";

interface FinanceScreenProps {
  data: OperationCenterData;
}

export default function FinanceScreen({ data }: FinanceScreenProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <FinanceCard
          label="Faturamento hoje"
          value={formatCurrency(data.metrics.salesTodayTotal)}
        />
        <FinanceCard
          label="Vendas hoje"
          value={String(data.metrics.salesTodayCount)}
        />
        <FinanceCard
          label="Health Financeiro"
          value={`${data.health.finance}/100`}
        />
      </div>

      <HealthScorePanel health={data.health} />

      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 text-white">
        <h3 className="text-lg font-bold">Integração Dashboard</h3>
        <p className="mt-2 text-sm text-slate-400">
          Métricas financeiras sincronizadas com vendas concluídas e health score
          operacional.
        </p>
      </div>
    </div>
  );
}

function FinanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
      <p className="text-sm text-emerald-200/80">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-100">{value}</p>
    </div>
  );
}
