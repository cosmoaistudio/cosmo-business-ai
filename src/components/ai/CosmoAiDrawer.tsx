import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { getUserDisplayName, useAuth } from "@/features/auth";
import { useCosmoAiContext } from "@/features/cosmo-ai";
import type {
  AiTimelineEvent,
  CosmoInsight,
  CosmoRecommendation,
  CosmoTask,
} from "@/features/cosmo-ai/types/cosmoAi";

import { useCosmoAiDrawer } from "./CosmoAiDrawerContext";
import "./cosmo-ai-drawer.css";

type DrawerTab = "resumo" | "prioridades" | "insights" | "acoes" | "historico";

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "prioridades", label: "Prioridades" },
  { id: "insights", label: "Insights" },
  { id: "acoes", label: "Ações" },
  { id: "historico", label: "Histórico" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function healthTone(score: number) {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}

function healthLabel(score: number) {
  if (score >= 80) return "Operação saudável";
  if (score >= 60) return "Operação em atenção";
  return "Operação crítica";
}

function formatRelative(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

function FindingRow({
  title,
  message,
  onResolve,
  onIgnore,
  onDetails,
}: {
  title: string;
  message: string;
  onResolve?: () => void;
  onIgnore?: () => void;
  onDetails: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="cosmo-ai-drawer__finding"
    >
      <div className="cosmo-ai-drawer__finding-mark" aria-hidden>
        ✓
      </div>
      <div className="cosmo-ai-drawer__finding-body">
        <p className="cosmo-ai-drawer__finding-title">{title}</p>
        <p className="cosmo-ai-drawer__finding-msg">{message}</p>
        <div className="cosmo-ai-drawer__finding-actions">
          {onResolve ? (
            <button type="button" onClick={onResolve}>
              <Check size={13} />
              Resolver
            </button>
          ) : null}
          <button type="button" onClick={onDetails}>
            <Eye size={13} />
            Ver detalhes
          </button>
          {onIgnore ? (
            <button type="button" onClick={onIgnore}>
              Ignorar
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

function InsightList({
  items,
  empty,
  onResolve,
  onIgnore,
  onDetails,
}: {
  items: CosmoInsight[];
  empty: string;
  onResolve: (id: string) => void;
  onIgnore: (id: string) => void;
  onDetails: (item: CosmoInsight) => void;
}) {
  if (items.length === 0) {
    return <div className="cosmo-ai-drawer__empty">{empty}</div>;
  }

  return (
    <div className="cosmo-ai-drawer__list">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <FindingRow
            key={item.id}
            title={item.title}
            message={item.message}
            onResolve={() => onResolve(item.id)}
            onIgnore={() => onIgnore(item.id)}
            onDetails={() => onDetails(item)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ActionsList({
  recommendations,
  tasks,
  onDetails,
}: {
  recommendations: CosmoRecommendation[];
  tasks: CosmoTask[];
  onDetails: (href?: string) => void;
}) {
  const items = [
    ...recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.description,
      href: item.href,
    })),
    ...tasks
      .filter((task) => task.status === "pending" || task.status === "in_progress")
      .map((task) => ({
        id: task.id,
        title: task.title,
        message: task.description,
        href: task.href,
      })),
  ];

  if (items.length === 0) {
    return (
      <div className="cosmo-ai-drawer__empty">
        Nenhuma ação pendente no momento.
      </div>
    );
  }

  return (
    <div className="cosmo-ai-drawer__list">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <FindingRow
            key={item.id}
            title={item.title}
            message={item.message}
            onDetails={() => onDetails(item.href)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function HistoryList({ events }: { events: AiTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="cosmo-ai-drawer__empty">
        O histórico aparece conforme você resolve ou ignora itens.
      </div>
    );
  }

  return (
    <div className="cosmo-ai-drawer__history">
      {events.slice(0, 12).map((event) => (
        <div key={event.id} className="cosmo-ai-drawer__history-item">
          <div className="cosmo-ai-drawer__history-dot" aria-hidden />
          <div>
            <p className="cosmo-ai-drawer__history-title">{event.title}</p>
            <p className="cosmo-ai-drawer__history-msg">{event.description}</p>
            <p className="cosmo-ai-drawer__history-time">
              {formatRelative(event.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CosmoAiDrawer({ docked = false }: { docked?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open, closeDrawer, toggleDrawer } = useCosmoAiDrawer();
  const { data, loading, resolveInsight, ignoreInsight } = useCosmoAiContext();
  const [tab, setTab] = useState<DrawerTab>("resumo");

  const firstName = getUserDisplayName(user).split(" ")[0] || "Operador";
  const greeting = getGreeting();
  const healthIndex = data?.healthIndex ?? null;
  const tone = healthIndex == null ? "good" : healthTone(healthIndex);

  const priorities = data?.priorities ?? [];
  const insights = data?.insights ?? [];
  const recommendations = data?.recommendations ?? [];
  const tasks = data?.tasks ?? [];
  const timeline = data?.timeline ?? [];
  const priorityBadge = priorities.length;

  const summaryFindings = useMemo(() => {
    const base = (priorities.length ? priorities : insights).slice(0, 5);
    if (base.length >= 3) return base;

    const used = new Set(base.map((item) => item.id));
    const extras = insights
      .filter((item) => !used.has(item.id))
      .slice(0, 5 - base.length);
    return [...base, ...extras];
  }, [priorities, insights]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeDrawer]);

  function openDetails(href?: string) {
    navigate(href || "/ia");
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.aside
            className="cosmo-ai-drawer"
            role="complementary"
            aria-label="Cosmo — gerente operacional"
            initial={{ x: "100%", opacity: 0.55 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.35 }}
            transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.85 }}
          >
            <header className="cosmo-ai-drawer__head">
              <div className="cosmo-ai-drawer__brand">
                <p className="cosmo-ai-drawer__brand-title">
                  <Sparkles size={15} />
                  Cosmo
                </p>
                <p className="cosmo-ai-drawer__brand-sub">Gerente Operacional</p>
                <div
                  className={`cosmo-ai-drawer__status cosmo-ai-drawer__status--${tone}`}
                >
                  <span>
                    {healthIndex == null
                      ? loading
                        ? "Analisando operação"
                        : "Aguardando análise"
                      : healthLabel(healthIndex)}
                  </span>
                  <strong>{healthIndex == null ? "—" : `${healthIndex}%`}</strong>
                </div>
              </div>
              <button
                type="button"
                className="cosmo-ai-drawer__close"
                onClick={closeDrawer}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            <nav className="cosmo-ai-drawer__tabs" aria-label="Seções da IA">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    tab === item.id
                      ? "cosmo-ai-drawer__tab cosmo-ai-drawer__tab--active"
                      : "cosmo-ai-drawer__tab"
                  }
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="cosmo-ai-drawer__body">
              {loading ? (
                <div className="cosmo-ai-drawer__empty">Analisando operação...</div>
              ) : null}

              {!loading && tab === "resumo" ? (
                <>
                  <p className="cosmo-ai-drawer__brief">
                    {greeting}, {firstName}.
                    <br />
                    Analisei sua operação.
                  </p>
                  <p className="cosmo-ai-drawer__brief-label">Hoje encontrei:</p>
                  <InsightList
                    items={summaryFindings}
                    empty="Operação estável. Continuo monitorando vendas, estoque e cozinha."
                    onResolve={resolveInsight}
                    onIgnore={ignoreInsight}
                    onDetails={(item) => openDetails(item.href)}
                  />
                </>
              ) : null}

              {!loading && tab === "prioridades" ? (
                <InsightList
                  items={priorities}
                  empty="Nenhuma prioridade crítica."
                  onResolve={resolveInsight}
                  onIgnore={ignoreInsight}
                  onDetails={(item) => openDetails(item.href)}
                />
              ) : null}

              {!loading && tab === "insights" ? (
                <InsightList
                  items={insights}
                  empty="Sem insights no momento."
                  onResolve={resolveInsight}
                  onIgnore={ignoreInsight}
                  onDetails={(item) => openDetails(item.href)}
                />
              ) : null}

              {!loading && tab === "acoes" ? (
                <ActionsList
                  recommendations={recommendations}
                  tasks={tasks}
                  onDetails={openDetails}
                />
              ) : null}

              {!loading && tab === "historico" ? (
                <HistoryList events={timeline} />
              ) : null}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        data-docked={docked ? "true" : "false"}
        className={
          open
            ? "cosmo-ai-drawer__fab cosmo-ai-drawer__fab--open"
            : "cosmo-ai-drawer__fab"
        }
        onClick={toggleDrawer}
        aria-label={open ? "Fechar gerente operacional" : "Abrir gerente operacional"}
        aria-expanded={open}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        <span className="cosmo-ai-drawer__fab-icon">
          <Sparkles size={20} />
          {priorityBadge > 0 ? (
            <span className="cosmo-ai-drawer__fab-badge">
              {priorityBadge > 9 ? "9+" : priorityBadge}
            </span>
          ) : null}
        </span>
        <span className="cosmo-ai-drawer__fab-copy">
          <span className="cosmo-ai-drawer__fab-title">Cosmo</span>
          <span className="cosmo-ai-drawer__fab-sub">Gerente Operacional</span>
        </span>
      </motion.button>
    </>
  );
}
