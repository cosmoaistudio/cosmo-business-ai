import TableLoadingState from "@/components/shared/TableLoadingState";
import EmptyState from "@/components/shared/EmptyState";
import { formatExecutionTime } from "../utils/automationLabels";
import AutomationStatusBadge from "./AutomationStatusBadge";
import type { AutomationLog } from "../types/automationRule";

interface AutomationLogTableProps {
  logs: AutomationLog[];
  loading?: boolean;
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR");
}

export default function AutomationLogTable({
  logs,
  loading = false,
}: AutomationLogTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <TableLoadingState label="Carregando logs" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          title="Nenhum log registrado"
          description="Os logs aparecerão aqui quando automações forem executadas."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">
                Regra
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Status
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Início
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Fim
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Tempo
              </th>
              <th scope="col" className="px-6 py-4 font-medium">
                Erro
              </th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-100 hover:bg-slate-50/80"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {log.automation_rules?.name ?? "Motor (sem regra)"}
                </td>
                <td className="px-6 py-4">
                  <AutomationStatusBadge logStatus={log.status} />
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatDate(log.started_at)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatDate(log.finished_at)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatExecutionTime(log.execution_time)}
                </td>
                <td className="max-w-xs truncate px-6 py-4 text-red-600">
                  {log.error_message ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
