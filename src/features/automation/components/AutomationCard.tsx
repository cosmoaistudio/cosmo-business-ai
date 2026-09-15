import { Copy, Pencil, Power, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Card from "@/components/shared/Card";
import AutomationStatusBadge from "./AutomationStatusBadge";
import type { AutomationRuleWithLastLog } from "../types/automationRule";
import {
  AUTOMATION_EVENT_LABELS,
  AUTOMATION_MODULE_LABELS,
  formatExecutionTime,
} from "../utils/automationLabels";

interface AutomationCardProps {
  rule: AutomationRuleWithLastLog;
  onToggle: (rule: AutomationRuleWithLastLog) => void;
  onDuplicate: (id: string) => void;
  onDelete: (rule: AutomationRuleWithLastLog) => void;
  actionLoading?: boolean;
}

function formatDate(date?: string | null) {
  if (!date) return "Nunca executada";
  return new Date(date).toLocaleString("pt-BR");
}

export default function AutomationCard({
  rule,
  onToggle,
  onDuplicate,
  onDelete,
  actionLoading = false,
}: AutomationCardProps) {
  const eventLabel =
    AUTOMATION_EVENT_LABELS[
      rule.trigger_type as keyof typeof AUTOMATION_EVENT_LABELS
    ] ?? rule.trigger_type;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">{rule.name}</h3>
            <AutomationStatusBadge enabled={rule.enabled} />
            {rule.last_log && (
              <AutomationStatusBadge logStatus={rule.last_log.status} />
            )}
          </div>

          {rule.description && (
            <p className="mt-2 text-sm text-slate-500">{rule.description}</p>
          )}

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Módulo
              </p>
              <p className="font-medium text-slate-700">
                {AUTOMATION_MODULE_LABELS[rule.module]}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Evento
              </p>
              <p className="font-medium text-slate-700">{eventLabel}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Última execução
              </p>
              <p className="font-medium text-slate-700">
                {formatDate(rule.last_log?.finished_at)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Tempo
              </p>
              <p className="font-medium text-slate-700">
                {formatExecutionTime(rule.last_log?.execution_time)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={actionLoading}
            onClick={() => onToggle(rule)}
          >
            <Power size={14} />
            {rule.enabled ? "Desativar" : "Ativar"}
          </Button>

          <Link to={`/automacoes/${rule.id}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <Pencil size={14} />
              Editar
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={actionLoading}
            onClick={() => onDuplicate(rule.id)}
          >
            <Copy size={14} />
            Duplicar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl text-red-600 hover:border-red-200 hover:bg-red-50"
            disabled={actionLoading}
            onClick={() => onDelete(rule)}
            aria-label={`Excluir ${rule.name}`}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
