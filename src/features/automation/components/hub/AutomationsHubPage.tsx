import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  GitBranch,
  Library,
  ListChecks,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { CatalogLibrary } from "../library/CatalogLibrary";
import { NodeFlowBuilder } from "../builder/NodeFlowBuilder";
import { ExecutionsPanel } from "../executions/ExecutionsPanel";
import { RulesPanel } from "../rules/RulesPanel";
import { useAutomationsHub } from "../../hooks/useAutomationsHub";
import type { AutomationsHubSectionId } from "../../types/automationsHub";
import "../../styles/automations-hub.css";

const SECTIONS: { id: AutomationsHubSectionId; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "library", label: "Biblioteca" },
  { id: "builder", label: "Builder" },
  { id: "rules", label: "Regras" },
  { id: "executions", label: "Execuções" },
];

export function AutomationsHubPage() {
  const {
    section,
    setSection,
    draft,
    setDraft,
    libraryTab,
    setLibraryTab,
    rulesQuery,
    logsQuery,
    overviewStats,
    triggers,
    actions,
  } = useAutomationsHub();

  return (
    <div className="cosmo-auto">
      <PageHeader
        title="Automações"
        subtitle="Conecta os módulos do Cosmo: Evento → Condição → Ação. Arquitetura preparada para expansão."
        action={
          <Link to="/automacoes/nova" className="cosmo-auto__cta">
            <Plus size={14} />
            Nova automação
          </Link>
        }
      />

      <nav className="cosmo-auto__nav" aria-label="Seções de Automações">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              section === item.id
                ? "cosmo-auto__nav-btn cosmo-auto__nav-btn--active"
                : "cosmo-auto__nav-btn"
            }
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {section === "overview" ? (
            <div className="space-y-4">
              <div className="cosmo-auto__grid cosmo-auto__grid--4">
                <div className="cosmo-auto__stat">
                  <div className="cosmo-auto__stat-label">Regras</div>
                  <div className="cosmo-auto__stat-value">
                    {overviewStats.rules}
                  </div>
                  <p className="cosmo-auto__desc">
                    {overviewStats.enabled} ativas
                  </p>
                </div>
                <div className="cosmo-auto__stat">
                  <div className="cosmo-auto__stat-label">Gatilhos</div>
                  <div className="cosmo-auto__stat-value">
                    {overviewStats.liveTriggers}
                  </div>
                  <p className="cosmo-auto__desc">
                    +{overviewStats.plannedTriggers} planejados
                  </p>
                </div>
                <div className="cosmo-auto__stat">
                  <div className="cosmo-auto__stat-label">Ações</div>
                  <div className="cosmo-auto__stat-value">
                    {overviewStats.liveActions}
                  </div>
                  <p className="cosmo-auto__desc">
                    +{overviewStats.plannedActions} planejadas
                  </p>
                </div>
                <div className="cosmo-auto__stat">
                  <div className="cosmo-auto__stat-label">Execuções</div>
                  <div className="cosmo-auto__stat-value">
                    {overviewStats.executions}
                  </div>
                  <p className="cosmo-auto__desc">
                    {overviewStats.success} ok · {overviewStats.failed} falhas ·{" "}
                    {overviewStats.running} andamento
                  </p>
                </div>
              </div>

              <section className="cosmo-auto__panel">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 text-sky-400" size={18} />
                  <div>
                    <h2 className="cosmo-auto__title">
                      Conector entre módulos
                    </h2>
                    <p className="cosmo-auto__desc">
                      Quando um evento ocorre (ex.: venda finalizada), as ações
                      planejadas podem atualizar Business Brain, Dashboard,
                      Financeiro, Estoque, Growth Hub e registrar atividade —
                      sem alterar as regras de negócio desses módulos.
                    </p>
                  </div>
                </div>

                <div className="cosmo-auto__grid cosmo-auto__grid--3 mt-4">
                  <button
                    type="button"
                    className="cosmo-auto__card"
                    onClick={() => setSection("library")}
                  >
                    <Library size={16} className="text-sky-400" />
                    <div className="cosmo-auto__card-title mt-2">Biblioteca</div>
                    <p className="cosmo-auto__card-desc">
                      Catálogo de gatilhos e ações separados.
                    </p>
                  </button>
                  <button
                    type="button"
                    className="cosmo-auto__card"
                    onClick={() => setSection("builder")}
                  >
                    <GitBranch size={16} className="text-sky-400" />
                    <div className="cosmo-auto__card-title mt-2">Builder</div>
                    <p className="cosmo-auto__card-desc">
                      Fluxo visual Evento → Condição → Ação → Resultado.
                    </p>
                  </button>
                  <button
                    type="button"
                    className="cosmo-auto__card"
                    onClick={() => setSection("executions")}
                  >
                    <ListChecks size={16} className="text-sky-400" />
                    <div className="cosmo-auto__card-title mt-2">
                      Execuções
                    </div>
                    <p className="cosmo-auto__card-desc">
                      Histórico: executada, falhou, em andamento.
                    </p>
                  </button>
                </div>

                <div className="cosmo-auto__cta-row">
                  <button
                    type="button"
                    className="cosmo-auto__cta"
                    onClick={() => {
                      setDraft({
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
                      });
                      setSection("builder");
                    }}
                  >
                    <Workflow size={14} />
                    Ver exemplo: venda finalizada
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {section === "library" ? (
            <CatalogLibrary
              tab={libraryTab}
              onTabChange={setLibraryTab}
              triggers={triggers}
              actions={actions}
              selectedTriggerKey={draft.triggerKey}
              selectedActionKeys={draft.actionKeys}
              onSelectTrigger={(triggerKey) =>
                setDraft((current) => ({ ...current, triggerKey }))
              }
              onToggleAction={(actionKey) =>
                setDraft((current) => ({
                  ...current,
                  actionKeys: current.actionKeys.includes(actionKey)
                    ? current.actionKeys.filter((key) => key !== actionKey)
                    : [...current.actionKeys, actionKey],
                }))
              }
            />
          ) : null}

          {section === "builder" ? (
            <NodeFlowBuilder
              draft={draft}
              onChange={setDraft}
              triggers={triggers}
              actions={actions}
            />
          ) : null}

          {section === "rules" ? (
            <RulesPanel
              rules={rulesQuery.data ?? []}
              loading={rulesQuery.isLoading}
              onReload={() => {
                void rulesQuery.refetch();
                void logsQuery.refetch();
              }}
            />
          ) : null}

          {section === "executions" ? (
            <ExecutionsPanel
              logs={logsQuery.data ?? []}
              loading={logsQuery.isLoading}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
