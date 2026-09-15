import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Cable,
  CreditCard,
  MonitorSmartphone,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/features/auth/context/AuthContext";
import { SAAS_ROLE_CATALOG } from "../catalog/roles.catalog";
import { OnboardingChecklistPanel } from "./OnboardingChecklistPanel";
import { DesktopUpdatesPanel } from "@/desktop/updater/DesktopUpdatesPanel";
import type { SettingsHubSectionId } from "../types/settingsHub";
import "../styles/saas.css";

const SECTIONS: { id: SettingsHubSectionId; label: string }[] = [
  { id: "system", label: "Atualizações" },
  { id: "account", label: "Conta" },
  { id: "company", label: "Empresa" },
  { id: "team", label: "Equipe" },
  { id: "integrations", label: "Integrações" },
  { id: "hardware", label: "Hardware" },
  { id: "subscription", label: "Assinatura" },
];

function readSettingsSectionParam(): string | null {
  const fromSearch = new URLSearchParams(window.location.search).get("section");
  if (fromSearch) return fromSearch;

  const hash = window.location.hash;
  const queryStart = hash.indexOf("?");
  if (queryStart === -1) return null;
  return new URLSearchParams(hash.slice(queryStart + 1)).get("section");
}

export function initialSettingsSection(): SettingsHubSectionId {
  if (typeof window === "undefined") return "system";
  const requested = readSettingsSectionParam();
  if (requested === "account") return "account";
  if (requested === "company") return "company";
  if (requested === "team") return "team";
  if (requested === "integrations") return "integrations";
  if (requested === "hardware") return "hardware";
  if (requested === "subscription") return "subscription";
  if (requested === "system") return "system";
  return "system";
}

export function SettingsHubPage() {
  const { profile, user } = useAuth();
  const [section, setSection] = useState<SettingsHubSectionId>(
    initialSettingsSection
  );

  return (
    <div className="cosmo-saas">
      <PageHeader
        title="Configurações"
        subtitle="Conta, empresa, equipe, atualizações, integrações e assinatura."
      />

      <nav className="cosmo-saas__nav" aria-label="Seções de configurações">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              section === item.id
                ? "cosmo-saas__nav-btn cosmo-saas__nav-btn--active"
                : "cosmo-saas__nav-btn"
            }
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {section === "account" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <UserRound className="text-sky-400" size={18} />
            <div>
              <h2 className="cosmo-saas__title">Conta</h2>
              <p className="cosmo-saas__desc">
                Preferências do usuário logado. Auth real permanece inalterado.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="cosmo-saas__muted">Nome</dt>
                  <dd className="text-slate-100">
                    {profile?.full_name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="cosmo-saas__muted">E-mail</dt>
                  <dd className="text-slate-100">{user?.email || "—"}</dd>
                </div>
                <div>
                  <dt className="cosmo-saas__muted">Papel</dt>
                  <dd className="text-slate-100">{profile?.role || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      {section === "company" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <Building2 className="text-sky-400" size={18} />
            <div className="w-full">
              <h2 className="cosmo-saas__title">Empresa</h2>
              <p className="cosmo-saas__desc">
                Organização atual e atalho para o guia operacional do Dashboard.
              </p>
              <p className="mt-3 text-sm text-slate-100">
                {profile?.organizations?.name || "Empresa não identificada"}
              </p>
              <Link to="/" className="cosmo-saas__btn mt-4 inline-flex">
                <Sparkles size={14} />
                Ver guia da operação
              </Link>
              <div className="mt-4">
                <OnboardingChecklistPanel />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {section === "team" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <Users className="text-sky-400" size={18} />
            <div className="w-full">
              <h2 className="cosmo-saas__title">Equipe & permissões</h2>
              <p className="cosmo-saas__desc">
                Catálogo comercial de papéis — somente arquitetura. Não altera o
                constraint do banco.
              </p>
              <div className="cosmo-saas__grid cosmo-saas__grid--2 mt-4">
                {SAAS_ROLE_CATALOG.map((role) => (
                  <div key={role.id} className="cosmo-saas__card">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-100">
                        {role.label}
                      </h3>
                      <span
                        className={
                          role.availability === "active"
                            ? "cosmo-saas__badge cosmo-saas__badge--ok"
                            : "cosmo-saas__badge cosmo-saas__badge--blue"
                        }
                      >
                        {role.availability === "active" ? "Ativo" : "Planejado"}
                      </span>
                    </div>
                    <p className="cosmo-saas__desc">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {section === "integrations" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <Cable className="text-sky-400" size={18} />
            <div>
              <h2 className="cosmo-saas__title">Integrações</h2>
              <p className="cosmo-saas__desc">
                Canais e loja digital. Pedido Digital permanece na rota dedicada.
              </p>
              <Link
                to="/configuracoes/pedido-digital"
                className="cosmo-saas__btn mt-4 inline-flex"
              >
                Abrir Pedido Digital
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {section === "hardware" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <MonitorSmartphone className="text-sky-400" size={18} />
            <div>
              <h2 className="cosmo-saas__title">Hardware</h2>
              <p className="cosmo-saas__desc">
                Impressoras, balanças e diagnóstico — via Desktop Agent.
              </p>
              <Link
                to="/configuracoes/hardware"
                className="cosmo-saas__btn mt-4 inline-flex"
              >
                Abrir Print / Scale Manager
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {section === "subscription" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <CreditCard className="text-sky-400" size={18} />
            <div>
              <h2 className="cosmo-saas__title">Assinatura</h2>
              <p className="cosmo-saas__desc">
                Plano, limites e gateways (Stripe / Mercado Pago).
              </p>
              <Link to="/meu-plano" className="cosmo-saas__btn mt-4 inline-flex">
                Ir para Meu Plano
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {section === "system" ? (
        <section className="cosmo-saas__panel">
          <div className="flex items-start gap-3">
            <MonitorSmartphone className="text-sky-400" size={18} />
            <div>
              <h2 className="cosmo-saas__title">Atualizações</h2>
              <p className="cosmo-saas__desc">
                Versão do Desktop, verificação remota e instalação manual.
              </p>
              <div className="mt-4">
                <DesktopUpdatesPanel />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/diagnostico" className="cosmo-saas__btn">
                  Diagnóstico
                </Link>
                <Link
                  to="/ajuda"
                  className="cosmo-saas__btn cosmo-saas__btn--ghost"
                >
                  Central de Ajuda
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
