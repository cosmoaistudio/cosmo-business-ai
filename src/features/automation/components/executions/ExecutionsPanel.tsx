import { memo, useMemo, useState } from "react";
import { formatExecutionTime } from "../../utils/automationLabels";
import type { AutomationLog } from "../../types/automationRule";
import type { ExecutionDisplayStatus } from "../../types/automationsHub";

interface ExecutionsPanelProps {
  logs: AutomationLog[];
  loading?: boolean;
}

type FilterId = "all" | ExecutionDisplayStatus;

function resolveDisplayStatus(log: AutomationLog): ExecutionDisplayStatus {
  if (!log.finished_at && log.status !== "failed") return "running";
  if (log.status === "success") return "success";
  if (log.status === "failed") return "failed";
  return "skipped";
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "success", label: "Executada" },
  { id: "failed", label: "Falhou" },
  { id: "running", label: "Em andamento" },
  { id: "skipped", label: "Ignorada" },
];

const STATUS_LABEL: Record<ExecutionDisplayStatus, string> = {
  success: "Executada",
  failed: "Falhou",
  running: "Em andamento",
  skipped: "Ignorada",
};

const STATUS_CLASS: Record<ExecutionDisplayStatus, string> = {
  success: "cosmo-auto__badge cosmo-auto__badge--success",
  failed: "cosmo-auto__badge cosmo-auto__badge--failed",
  running: "cosmo-auto__badge cosmo-auto__badge--running",
  skipped: "cosmo-auto__badge",
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR");
}

function ExecutionsPanelComponent({
  logs,
  loading = false,
}: ExecutionsPanelProps) {
  const [filter, setFilter] = useState<FilterId>("all");

  const enriched = useMemo(
    () =>
      logs.map((log) => ({
        log,
        displayStatus: resolveDisplayStatus(log),
      })),
    [logs]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return enriched;
    return enriched.filter((item) => item.displayStatus === filter);
  }, [enriched, filter]);

  const counts = useMemo(() => {
    return {
      all: enriched.length,
      success: enriched.filter((i) => i.displayStatus === "success").length,
      failed: enriched.filter((i) => i.displayStatus === "failed").length,
      running: enriched.filter((i) => i.displayStatus === "running").length,
      skipped: enriched.filter((i) => i.displayStatus === "skipped").length,
    };
  }, [enriched]);

  return (
    <section className="cosmo-auto__panel">
      <div>
        <h2 className="cosmo-auto__title">Execuções</h2>
        <p className="cosmo-auto__desc">
          Histórico do motor existente — status de apresentação: Executada,
          Falhou, Em andamento.
        </p>
      </div>

      <div className="cosmo-auto__filter-row mt-4" role="toolbar" aria-label="Filtro de status">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              filter === item.id
                ? "cosmo-auto__filter cosmo-auto__filter--active"
                : "cosmo-auto__filter"
            }
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            <span className="ml-1 opacity-70">
              ({counts[item.id as keyof typeof counts] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="cosmo-auto__muted text-sm">Carregando execuções…</p>
      ) : filtered.length === 0 ? (
        <p className="cosmo-auto__muted text-sm">
          Nenhuma execução neste filtro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="cosmo-auto__table">
            <thead>
              <tr>
                <th scope="col">Regra</th>
                <th scope="col">Status</th>
                <th scope="col">Início</th>
                <th scope="col">Fim</th>
                <th scope="col">Tempo</th>
                <th scope="col">Erro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ log, displayStatus }) => (
                <tr key={log.id}>
                  <td>{log.automation_rules?.name ?? "Motor (sem regra)"}</td>
                  <td>
                    <span className={STATUS_CLASS[displayStatus]}>
                      {STATUS_LABEL[displayStatus]}
                    </span>
                  </td>
                  <td className="cosmo-auto__muted">
                    {formatDate(log.started_at)}
                  </td>
                  <td className="cosmo-auto__muted">
                    {formatDate(log.finished_at)}
                  </td>
                  <td className="cosmo-auto__muted">
                    {formatExecutionTime(log.execution_time)}
                  </td>
                  <td className="cosmo-auto__muted">
                    {log.error_message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export const ExecutionsPanel = memo(ExecutionsPanelComponent);
