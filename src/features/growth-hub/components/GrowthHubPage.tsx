import {
  CalendarDays,
  Clapperboard,
  Megaphone,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import PageHeader from "@/components/shared/PageHeader";

import {
  GROWTH_NICHES,
  GROWTH_NETWORKS,
  GROWTH_OBJECTIVES,
  IDEA_QUANTITY_OPTIONS,
} from "../constants/growthHub.constants";
import { useGrowthHub } from "../hooks/useGrowthHub";
import type {
  GrowthCalendarView,
  GrowthHubSectionId,
} from "../types/growthHub.types";
import "../styles/growth-hub.css";

const SECTIONS: { id: GrowthHubSectionId; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "calendar", label: "Calendário" },
  { id: "ideas", label: "Ideias" },
  { id: "content", label: "Conteúdo" },
  { id: "campaigns", label: "Campanhas" },
  { id: "traffic", label: "Tráfego Pago" },
  { id: "metrics", label: "Métricas" },
  { id: "automations", label: "Automações" },
  { id: "ai", label: "IA" },
];

const CALENDAR_VIEWS: { id: GrowthCalendarView; label: string }[] = [
  { id: "month", label: "Mensal" },
  { id: "week", label: "Semanal" },
  { id: "list", label: "Lista" },
  { id: "cards", label: "Cards" },
];

function statusBadge(status: string) {
  if (status === "published" || status === "active" || status === "ready") {
    return "cosmo-growth__badge cosmo-growth__badge--green";
  }
  if (status === "coming_soon" || status === "planned" || status === "ai_pending") {
    return "cosmo-growth__badge";
  }
  return "cosmo-growth__badge cosmo-growth__badge--blue";
}

function networkLabel(id: string) {
  return GROWTH_NETWORKS.find((item) => item.id === id)?.label ?? id;
}

export function GrowthHubPage() {
  const {
    snapshot,
    section,
    setSection,
    calendarView,
    setCalendarView,
    ideaRequest,
    updateIdeaRequest,
    generating,
    generateIdeas,
    archiveIdea,
    overviewStats,
  } = useGrowthHub();

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="cosmo-growth">
      <PageHeader
        title="Growth Hub"
        subtitle="Crescimento da empresa: conteúdo, campanhas, tráfego e IA — sem misturar com a operação."
      />

      <nav className="cosmo-growth__nav" aria-label="Seções do Growth Hub">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              section === item.id
                ? "cosmo-growth__nav-btn cosmo-growth__nav-btn--active"
                : "cosmo-growth__nav-btn"
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {section === "overview" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">
                  Dashboard de crescimento
                </h2>
                <p className="cosmo-growth__panel-desc">
                  Marketing · Conteúdo · Campanhas · Tráfego · IA · Calendário
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--6">
                {overviewStats.map((stat) => (
                  <article key={stat.id} className="cosmo-growth__stat">
                    <p className="cosmo-growth__stat-label">{stat.label}</p>
                    <p className="cosmo-growth__stat-value">{stat.value}</p>
                    <p className="cosmo-growth__stat-hint">{stat.hint}</p>
                  </article>
                ))}
              </div>
              <div className="cosmo-growth__actions">
                <button
                  type="button"
                  className="cosmo-growth__btn cosmo-growth__btn--primary"
                  onClick={() => setSection("ideas")}
                >
                  <Sparkles size={15} />
                  Gerar ideias
                </button>
                <button
                  type="button"
                  className="cosmo-growth__btn"
                  onClick={() => setSection("calendar")}
                >
                  <CalendarDays size={15} />
                  Abrir calendário
                </button>
                <button
                  type="button"
                  className="cosmo-growth__btn"
                  onClick={() => setSection("traffic")}
                >
                  <TrendingUp size={15} />
                  Tráfego pago
                </button>
              </div>
            </section>
          ) : null}

          {section === "calendar" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="cosmo-growth__panel-title">
                    Calendário Editorial
                  </h2>
                  <p className="cosmo-growth__panel-desc">
                    Planeje publicações em visão mensal, semanal, lista ou cards.
                  </p>
                </div>
                <div className="cosmo-growth__view-toggle">
                  {CALENDAR_VIEWS.map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      data-active={calendarView === view.id}
                      onClick={() => setCalendarView(view.id)}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>

              {(calendarView === "month" || calendarView === "week") && (
                <>
                  <div className="cosmo-growth__calendar-grid">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-slate-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="cosmo-growth__calendar-grid">
                    {Array.from({
                      length: calendarView === "week" ? 7 : 28,
                    }).map((_, index) => {
                      const item = snapshot.calendar[index % snapshot.calendar.length];
                      const show = calendarView === "week" ? index < 7 : index < 28;
                      if (!show) return null;
                      return (
                        <div key={index} className="cosmo-growth__calendar-cell">
                          <span>{index + 1}</span>
                          {item && index % 3 === 0 ? (
                            <span className="cosmo-growth__pill" title={item.title}>
                              {item.title}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {calendarView === "list" ? (
                <div className="space-y-2">
                  {snapshot.calendar.map((item) => (
                    <div
                      key={item.id}
                      className="cosmo-growth__card flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p>
                          {networkLabel(item.network)} ·{" "}
                          {new Date(item.scheduledAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span className={statusBadge(item.status)}>{item.status}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {calendarView === "cards" ? (
                <div className="cosmo-growth__grid cosmo-growth__grid--3">
                  {snapshot.calendar.map((item) => (
                    <article key={item.id} className="cosmo-growth__card">
                      <p className="cosmo-growth__meta">
                        {networkLabel(item.network)}
                      </p>
                      <h3 className="mt-2">{item.title}</h3>
                      <p>
                        {new Date(item.scheduledAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="mt-3">
                        <span className={statusBadge(item.status)}>
                          {item.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {section === "ideas" ? (
            <section className="cosmo-growth__panel space-y-5">
              <div>
                <h2 className="cosmo-growth__panel-title">Ideias ilimitadas</h2>
                <p className="cosmo-growth__panel-desc">
                  Nicho → Tema → Objetivo → Rede → Quantidade → Gerar. Arquitetura
                  pronta; IA conectável depois.
                </p>
              </div>

              <div className="cosmo-growth__form">
                <div className="cosmo-growth__field">
                  <label htmlFor="growth-niche">Nicho</label>
                  <select
                    id="growth-niche"
                    value={ideaRequest.niche}
                    onChange={(event) =>
                      updateIdeaRequest({
                        niche: event.target.value as typeof ideaRequest.niche,
                      })
                    }
                  >
                    {GROWTH_NICHES.map((niche) => (
                      <option key={niche.id} value={niche.id}>
                        {niche.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cosmo-growth__field cosmo-growth__form-span">
                  <label htmlFor="growth-theme">Tema</label>
                  <input
                    id="growth-theme"
                    value={ideaRequest.theme}
                    onChange={(event) =>
                      updateIdeaRequest({ theme: event.target.value })
                    }
                    placeholder="Ex.: combo do almoço, promoção de terça..."
                  />
                </div>

                <div className="cosmo-growth__field">
                  <label htmlFor="growth-objective">Objetivo</label>
                  <select
                    id="growth-objective"
                    value={ideaRequest.objective}
                    onChange={(event) =>
                      updateIdeaRequest({
                        objective: event.target
                          .value as typeof ideaRequest.objective,
                      })
                    }
                  >
                    {GROWTH_OBJECTIVES.map((objective) => (
                      <option key={objective.id} value={objective.id}>
                        {objective.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cosmo-growth__field">
                  <label htmlFor="growth-network">Rede social</label>
                  <select
                    id="growth-network"
                    value={ideaRequest.network}
                    onChange={(event) =>
                      updateIdeaRequest({
                        network: event.target
                          .value as typeof ideaRequest.network,
                      })
                    }
                  >
                    {GROWTH_NETWORKS.map((network) => (
                      <option key={network.id} value={network.id}>
                        {network.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cosmo-growth__field">
                  <label htmlFor="growth-qty">Quantidade</label>
                  <select
                    id="growth-qty"
                    value={ideaRequest.quantity}
                    onChange={(event) =>
                      updateIdeaRequest({
                        quantity: Number(event.target.value),
                      })
                    }
                  >
                    {IDEA_QUANTITY_OPTIONS.map((qty) => (
                      <option key={qty} value={qty}>
                        {qty} ideias
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cosmo-growth__actions">
                <button
                  type="button"
                  className="cosmo-growth__btn cosmo-growth__btn--primary"
                  disabled={generating}
                  onClick={() => void generateIdeas()}
                >
                  <Zap size={15} />
                  {generating ? "Gerando..." : "Gerar ideias"}
                </button>
                <span className="cosmo-growth__badge">Arquitetura local</span>
              </div>

              {snapshot.ideas.length === 0 ? (
                <div className="cosmo-growth__card">
                  <h3>Nenhuma ideia ainda</h3>
                  <p>
                    Preencha o fluxo e gere a primeira leva. Quando a IA estiver
                    conectada, o mesmo botão usará o provider real.
                  </p>
                </div>
              ) : (
                <div className="cosmo-growth__grid cosmo-growth__grid--3">
                  {snapshot.ideas.map((idea) => (
                    <article key={idea.id} className="cosmo-growth__card">
                      <div className="flex items-center justify-between gap-2">
                        <p className="cosmo-growth__meta">
                          {networkLabel(idea.network)}
                        </p>
                        <span className={statusBadge(idea.source)}>
                          {idea.source === "ai_pending" ? "IA pending" : "manual"}
                        </span>
                      </div>
                      <h3 className="mt-2">{idea.title}</h3>
                      <p>{idea.hook}</p>
                      <div className="cosmo-growth__actions mt-3">
                        <button
                          type="button"
                          className="cosmo-growth__btn"
                          onClick={() => archiveIdea(idea.id)}
                        >
                          Arquivar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {section === "content" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">Conteúdo</h2>
                <p className="cosmo-growth__panel-desc">
                  Pipeline editorial — do rascunho à publicação.
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--3">
                {snapshot.content.map((item) => (
                  <article key={item.id} className="cosmo-growth__card">
                    <div className="mb-2 flex items-center gap-2 text-sky-300">
                      <Clapperboard size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {item.format}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>
                      {networkLabel(item.network)} ·{" "}
                      {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="mt-3">
                      <span className={statusBadge(item.status)}>
                        {item.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "campaigns" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">Campanhas</h2>
                <p className="cosmo-growth__panel-desc">
                  Organize objetivos e redes em campanhas de crescimento.
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--3">
                {snapshot.campaigns.map((campaign) => (
                  <article key={campaign.id} className="cosmo-growth__card">
                    <div className="mb-2 text-sky-300">
                      <Megaphone size={18} />
                    </div>
                    <h3>{campaign.name}</h3>
                    <p>
                      Objetivo: {campaign.objective} ·{" "}
                      {campaign.networks.map(networkLabel).join(", ")}
                    </p>
                    <div className="mt-3">
                      <span className={statusBadge(campaign.status)}>
                        {campaign.status}
                      </span>
                    </div>
                  </article>
                ))}
                <article className="cosmo-growth__card border-dashed">
                  <h3>Nova campanha</h3>
                  <p>
                    Estrutura pronta para criar campanhas com datas, redes e CTA.
                  </p>
                  <span className="cosmo-growth__badge mt-3 inline-flex">
                    Em breve
                  </span>
                </article>
              </div>
            </section>
          ) : null}

          {section === "traffic" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">Tráfego pago</h2>
                <p className="cosmo-growth__panel-desc">
                  Meta Ads · Google Ads · TikTok Ads — arquitetura sem APIs nesta
                  versão.
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--3">
                {snapshot.traffic.map((channel) => (
                  <article key={channel.id} className="cosmo-growth__card">
                    <div className="flex items-center justify-between gap-2">
                      <h3>{channel.name}</h3>
                      <span className={statusBadge(channel.status)}>
                        Em breve
                      </span>
                    </div>
                    <p>{channel.description}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="cosmo-growth__meta">Invest.</p>
                        <p className="text-sm font-semibold text-white">
                          {channel.metricsPlaceholder.spend}
                        </p>
                      </div>
                      <div>
                        <p className="cosmo-growth__meta">Cliques</p>
                        <p className="text-sm font-semibold text-white">
                          {channel.metricsPlaceholder.clicks}
                        </p>
                      </div>
                      <div>
                        <p className="cosmo-growth__meta">ROAS</p>
                        <p className="text-sm font-semibold text-white">
                          {channel.metricsPlaceholder.roas}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "metrics" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">Métricas</h2>
                <p className="cosmo-growth__panel-desc">
                  Indicadores de crescimento — conecte canais para popular.
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--4">
                {snapshot.metrics.map((metric) => (
                  <article key={metric.id} className="cosmo-growth__stat">
                    <p className="cosmo-growth__stat-label">{metric.label}</p>
                    <p className="cosmo-growth__stat-value">{metric.value}</p>
                    <p className="cosmo-growth__stat-hint">{metric.hint}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "automations" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">
                  Automações de crescimento
                </h2>
                <p className="cosmo-growth__panel-desc">
                  Fluxos futuros ligados a conteúdo e campanhas (não confundir com
                  o motor operacional).
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--3">
                {snapshot.automations.map((item) => (
                  <article key={item.id} className="cosmo-growth__card">
                    <div className="mb-2 text-sky-300">
                      <Workflow size={18} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="mt-3">
                      <span className={statusBadge(item.status)}>
                        {item.status === "ready_soon" ? "Em breve" : "Planejado"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "ai" ? (
            <section className="cosmo-growth__panel space-y-4">
              <div>
                <h2 className="cosmo-growth__panel-title">Estúdio de IA</h2>
                <p className="cosmo-growth__panel-desc">
                  Painel preparado para roteiros, legendas, hashtags, ofertas e
                  criativos.
                </p>
              </div>
              <div className="cosmo-growth__grid cosmo-growth__grid--3">
                {snapshot.aiSlots.map((slot) => (
                  <article key={slot.id} className="cosmo-growth__card">
                    <div className="mb-2 flex items-center gap-2 text-sky-300">
                      <Target size={16} />
                      <span className="cosmo-growth__badge cosmo-growth__badge--blue">
                        Slot IA
                      </span>
                    </div>
                    <h3>{slot.title}</h3>
                    <p>{slot.description}</p>
                    <button
                      type="button"
                      className="cosmo-growth__btn mt-3"
                      disabled
                    >
                      Conectar IA
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
