import { CreditCard, Store, Users } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useMyPlan } from "../hooks/useMyPlan";
import { formatBrl, formatDate, LIMIT_LABELS } from "../utils/format";
import { OnboardingChecklistPanel } from "./OnboardingChecklistPanel";
import "../styles/saas.css";

export function MyPlanPage() {
  const {
    subscription,
    plan,
    plans,
    meters,
    billingAdapters,
    loading,
    setPlan,
    settingPlan,
  } = useMyPlan();

  const usersMeter = meters.find((m) => m.resource === "users");
  const storesMeter = meters.find((m) => m.resource === "stores");

  return (
    <div className="cosmo-saas">
      <PageHeader
        title="Meu Plano"
        subtitle="Assinatura, limites e uso da plataforma — preparado para clientes pagantes."
      />

      {loading ? (
        <p className="cosmo-saas__muted">Carregando plano…</p>
      ) : (
        <>
          <div className="cosmo-saas__grid cosmo-saas__grid--4">
            <div className="cosmo-saas__stat">
              <div className="cosmo-saas__stat-label">Plano atual</div>
              <div className="cosmo-saas__stat-value">{plan?.name ?? "—"}</div>
              <p className="cosmo-saas__desc">
                Status: {subscription?.status ?? "—"}
              </p>
            </div>
            <div className="cosmo-saas__stat">
              <div className="cosmo-saas__stat-label">Valor mensal</div>
              <div className="cosmo-saas__stat-value">
                {formatBrl(subscription?.monthlyPriceBrl)}
              </div>
              <p className="cosmo-saas__desc">Cobrança em BRL</p>
            </div>
            <div className="cosmo-saas__stat">
              <div className="cosmo-saas__stat-label">Próxima cobrança</div>
              <div className="cosmo-saas__stat-value" style={{ fontSize: "1.05rem" }}>
                {formatDate(subscription?.currentPeriodEnd)}
              </div>
              <p className="cosmo-saas__desc">
                Gateway: {subscription?.billingProvider ?? "none"}
              </p>
            </div>
            <div className="cosmo-saas__stat">
              <div className="cosmo-saas__stat-label">Equipe / Lojas</div>
              <div className="cosmo-saas__stat-value">
                <span className="inline-flex items-center gap-2 text-base">
                  <Users size={16} /> {usersMeter?.used ?? 0}
                  <Store size={16} /> {storesMeter?.used ?? 0}
                </span>
              </div>
              <p className="cosmo-saas__desc">
                Limites: {usersMeter?.limit ?? "∞"} usuários ·{" "}
                {storesMeter?.limit ?? "∞"} lojas
              </p>
            </div>
          </div>

          <section className="cosmo-saas__panel">
            <h2 className="cosmo-saas__title">Uso do sistema</h2>
            <p className="cosmo-saas__desc">
              Arquitetura de limites pronta. Medidores server-side entram com o
              gateway.
            </p>
            <div className="cosmo-saas__grid cosmo-saas__grid--4 mt-4">
              {meters.map((meter) => {
                const pct =
                  meter.limit == null
                    ? 8
                    : Math.min(100, Math.round((meter.used / meter.limit) * 100));
                return (
                  <div key={meter.resource} className="cosmo-saas__card">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {LIMIT_LABELS[meter.resource]}
                      </span>
                      <span className="cosmo-saas__badge">
                        {meter.used}/{meter.limit ?? "∞"}
                      </span>
                    </div>
                    <div className="cosmo-saas__meter">
                      <div
                        className="cosmo-saas__meter-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="cosmo-saas__panel">
            <h2 className="cosmo-saas__title">Planos</h2>
            <p className="cosmo-saas__desc">
              Starter · Professional · Business · Enterprise — estrutura
              comercial sem gateway nesta sprint.
            </p>
            <div className="cosmo-saas__grid cosmo-saas__grid--4 mt-4">
              {plans.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.highlighted
                      ? "cosmo-saas__card cosmo-saas__card--hl"
                      : "cosmo-saas__card"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-100">{item.name}</h3>
                    {subscription?.planId === item.id ? (
                      <span className="cosmo-saas__badge cosmo-saas__badge--ok">
                        Atual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xl font-bold text-white">
                    {formatBrl(item.monthlyPriceBrl)}
                    {item.monthlyPriceBrl != null ? (
                      <span className="text-sm font-medium text-slate-400">
                        /mês
                      </span>
                    ) : null}
                  </p>
                  <p className="cosmo-saas__desc">{item.description}</p>
                  <button
                    type="button"
                    className="cosmo-saas__btn mt-3"
                    disabled={settingPlan || subscription?.planId === item.id}
                    onClick={() => void setPlan(item.id)}
                  >
                    {subscription?.planId === item.id
                      ? "Plano ativo"
                      : "Selecionar (local)"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="cosmo-saas__panel">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 text-sky-400" size={18} />
              <div>
                <h2 className="cosmo-saas__title">Assinatura (gateways)</h2>
                <p className="cosmo-saas__desc">
                  Adapters prontos — sem integração real nesta sprint.
                </p>
                <ul className="mt-3 space-y-2">
                  {billingAdapters.map((adapter) => (
                    <li
                      key={adapter.id}
                      className="flex items-center justify-between gap-3 text-sm text-slate-200"
                    >
                      <span>{adapter.label}</span>
                      <span
                        className={
                          adapter.isConfigured()
                            ? "cosmo-saas__badge cosmo-saas__badge--ok"
                            : "cosmo-saas__badge cosmo-saas__badge--blue"
                        }
                      >
                        {adapter.isConfigured()
                          ? "Chave detectada"
                          : "Arquitetura pronta"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <OnboardingChecklistPanel />
        </>
      )}
    </div>
  );
}
