import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Plus } from "lucide-react";
import {
  findActionByKey,
  findTriggerByKey,
  type ActionCatalogItem,
  type TriggerCatalogItem,
} from "../../catalog";
import type { NodeFlowDraft } from "../../types/automationsHub";
import { createActionId } from "../../utils/automationLabels";
import type {
  AutomationActionType,
  AutomationModule,
  CreateAutomationRuleDTO,
} from "../../types/automationRule";
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_MODULES,
} from "../../types/automationRule";

interface NodeFlowBuilderProps {
  draft: NodeFlowDraft;
  onChange: (draft: NodeFlowDraft) => void;
  triggers: TriggerCatalogItem[];
  actions: ActionCatalogItem[];
}

function isLiveActionKey(key: string): key is AutomationActionType {
  return (AUTOMATION_ACTION_TYPES as readonly string[]).includes(key);
}

function resolveModule(module?: string): AutomationModule {
  if (
    module &&
    (AUTOMATION_MODULES as readonly string[]).includes(module)
  ) {
    return module as AutomationModule;
  }
  return "system";
}

function NodeFlowBuilderComponent({
  draft,
  onChange,
  triggers,
  actions,
}: NodeFlowBuilderProps) {
  const navigate = useNavigate();
  const trigger = draft.triggerKey
    ? findTriggerByKey(draft.triggerKey)
    : undefined;
  const selectedActions = useMemo(
    () =>
      draft.actionKeys
        .map((key) => findActionByKey(key))
        .filter(Boolean) as ActionCatalogItem[],
    [draft.actionKeys]
  );

  function openLiveEditor() {
    const liveActionKeys: AutomationActionType[] = selectedActions
      .map((item) => item.actionKey)
      .filter(isLiveActionKey);

    const editorDraft: CreateAutomationRuleDTO = {
      name: trigger ? `Quando: ${trigger.label}` : "Nova automação",
      description:
        "Rascunho do builder visual (Evento → Condição → Ação). Ações planejadas não são persistidas até implementação.",
      module: resolveModule(trigger?.module),
      trigger_type:
        trigger?.availability === "live"
          ? trigger.triggerKey
          : "SALE_COMPLETED",
      conditions: [],
      actions: liveActionKeys.map((type) => ({
        id: createActionId(),
        type,
        params: {},
      })),
      enabled: true,
      priority: 0,
    };

    navigate("/automacoes/nova", { state: { draft: editorDraft } });
  }

  return (
    <section className="cosmo-auto__panel">
      <div>
        <h2 className="cosmo-auto__title">Builder visual</h2>
        <p className="cosmo-auto__desc">
          Arquitetura Evento → Condição → Ação → Resultado. Sem execução do
          grafo nesta sprint — o editor clássico permanece a fonte de
          persistência das regras ao vivo.
        </p>
      </div>

      <div className="cosmo-auto__flow mt-4" aria-label="Fluxo de automação">
        <article className="cosmo-auto__node">
          <div className="cosmo-auto__node-kind">Evento</div>
          <div className="cosmo-auto__node-title">
            {trigger?.label ?? "Selecione um gatilho"}
          </div>
          <p className="cosmo-auto__node-meta">
            {trigger?.description ??
              "Escolha um evento na biblioteca ou abaixo."}
          </p>
          <select
            className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            value={draft.triggerKey ?? ""}
            onChange={(event) =>
              onChange({ ...draft, triggerKey: event.target.value || null })
            }
          >
            <option value="">Selecionar gatilho…</option>
            {triggers.map((item) => (
              <option key={item.id} value={item.triggerKey}>
                {item.label}
                {item.availability === "planned" ? " (planejado)" : ""}
              </option>
            ))}
          </select>
        </article>

        <div className="cosmo-auto__connector" aria-hidden>
          <ArrowDown className="md:hidden" size={18} />
          <ArrowRight className="hidden md:block" size={18} />
        </div>

        <article className="cosmo-auto__node">
          <div className="cosmo-auto__node-kind">Condição</div>
          <div className="cosmo-auto__node-title">Filtro</div>
          <p className="cosmo-auto__node-meta">
            Condições AND serão aplicadas pelo motor existente no editor.
          </p>
          <input
            className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            value={draft.conditionSummary}
            onChange={(event) =>
              onChange({ ...draft, conditionSummary: event.target.value })
            }
            placeholder="Ex.: valor > 100"
          />
        </article>

        <div className="cosmo-auto__connector" aria-hidden>
          <ArrowDown className="md:hidden" size={18} />
          <ArrowRight className="hidden md:block" size={18} />
        </div>

        <article className="cosmo-auto__node">
          <div className="cosmo-auto__node-kind">Ação</div>
          <div className="cosmo-auto__node-title">
            {selectedActions.length
              ? `${selectedActions.length} ação(ões)`
              : "Nenhuma ação"}
          </div>
          <ul className="cosmo-auto__node-meta mt-2 space-y-1">
            {selectedActions.length === 0 ? (
              <li>Selecione ações na biblioteca.</li>
            ) : (
              selectedActions.map((action) => (
                <li key={action.id}>
                  • {action.label}
                  {action.availability === "planned" ? " (planejado)" : ""}
                </li>
              ))
            )}
          </ul>
          <select
            className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
            value=""
            onChange={(event) => {
              const key = event.target.value;
              if (!key || draft.actionKeys.includes(key)) return;
              onChange({
                ...draft,
                actionKeys: [...draft.actionKeys, key],
              });
            }}
          >
            <option value="">Adicionar ação…</option>
            {actions.map((item) => (
              <option key={item.id} value={item.actionKey}>
                {item.label}
                {item.availability === "planned" ? " (planejado)" : ""}
              </option>
            ))}
          </select>
        </article>

        <div className="cosmo-auto__connector" aria-hidden>
          <ArrowDown className="md:hidden" size={18} />
          <ArrowRight className="hidden md:block" size={18} />
        </div>

        <article className="cosmo-auto__node">
          <div className="cosmo-auto__node-kind">Resultado</div>
          <div className="cosmo-auto__node-title">Módulos conectados</div>
          <p className="cosmo-auto__node-meta">
            {[
              ...(trigger?.connects ?? []),
              ...selectedActions.flatMap((a) => a.connects),
            ]
              .filter((value, index, arr) => arr.indexOf(value) === index)
              .join(" · ") || "—"}
          </p>
          <p className="cosmo-auto__node-meta mt-2">
            Execução real continua no AutomationEngine existente. Este canvas
            documenta a arquitetura de conexão.
          </p>
        </article>
      </div>

      <div className="cosmo-auto__cta-row">
        <button type="button" className="cosmo-auto__cta" onClick={openLiveEditor}>
          <Plus size={14} />
          Continuar no editor (regras ao vivo)
        </button>
        <button
          type="button"
          className="cosmo-auto__cta cosmo-auto__cta--ghost"
          onClick={() =>
            onChange({
              triggerKey: "SALE_COMPLETED",
              conditionSummary: "Sempre (sem filtro)",
              actionKeys: [
                "UPDATE_BUSINESS_BRAIN",
                "UPDATE_DASHBOARD",
                "CREATE_FINANCIAL_ENTRY",
                "UPDATE_INVENTORY",
                "UPDATE_GROWTH_HUB",
                "LOG_ACTIVITY",
              ],
            })
          }
        >
          Exemplo: venda finalizada
        </button>
      </div>
    </section>
  );
}

export const NodeFlowBuilder = memo(NodeFlowBuilderComponent);
