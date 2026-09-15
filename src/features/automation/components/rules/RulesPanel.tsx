import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Workflow } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import AutomationCard from "../AutomationCard";
import DeleteAutomationRuleDialog from "../DeleteAutomationRuleDialog";
import { useAutomationRuleActions } from "../../hooks/useAutomationRuleActions";
import type { AutomationRuleWithLastLog } from "../../types/automationRule";

interface RulesPanelProps {
  rules: AutomationRuleWithLastLog[];
  loading?: boolean;
  onReload: () => void;
}

function RulesPanelComponent({
  rules,
  loading = false,
  onReload,
}: RulesPanelProps) {
  const { loading: actionLoading, toggleEnabled, duplicateRule } =
    useAutomationRuleActions(onReload);
  const [deletingRule, setDeletingRule] =
    useState<AutomationRuleWithLastLog | null>(null);

  return (
    <section className="cosmo-auto__panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="cosmo-auto__title">Regras ativas</h2>
          <p className="cosmo-auto__desc">
            Regras SE/ENTÃO persistidas — execução pelo AutomationEngine
            existente (sem alteração nesta sprint).
          </p>
        </div>
        <Link to="/automacoes/nova" className="cosmo-auto__cta">
          <Plus size={14} />
          Nova automação
        </Link>
      </div>

      <div className="cosmo-auto__rules-host mt-4">
        {loading ? (
          <TableLoadingState label="Carregando automações" rows={3} />
        ) : rules.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Nenhuma automação configurada"
            description="Crie regras para reagir automaticamente a eventos do estoque, vendas, produtos e clientes."
            action={
              <Link to="/automacoes/nova" className="cosmo-auto__cta">
                Criar primeira automação
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <AutomationCard
                key={rule.id}
                rule={rule}
                actionLoading={actionLoading}
                onToggle={toggleEnabled}
                onDuplicate={duplicateRule}
                onDelete={setDeletingRule}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteAutomationRuleDialog
        rule={deletingRule}
        open={Boolean(deletingRule)}
        onOpenChange={(open) => {
          if (!open) setDeletingRule(null);
        }}
        onDeleted={onReload}
      />
    </section>
  );
}

export const RulesPanel = memo(RulesPanelComponent);
