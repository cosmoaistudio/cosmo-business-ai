import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useDiagnostics } from "../hooks/useDiagnostics";
import type { DiagnosticStatus } from "../types/diagnostics";
import "../styles/saas.css";

function badgeClass(status: DiagnosticStatus) {
  if (status === "ok") return "cosmo-saas__badge cosmo-saas__badge--ok";
  if (status === "degraded") return "cosmo-saas__badge cosmo-saas__badge--warn";
  if (status === "down") return "cosmo-saas__badge cosmo-saas__badge--down";
  return "cosmo-saas__badge";
}

export function DiagnosticsPage() {
  const { data, isLoading, isFetching, refetch } = useDiagnostics();

  return (
    <div className="cosmo-saas">
      <PageHeader
        title="Diagnóstico"
        subtitle="Status, Desktop Agent, banco, Supabase, internet, versão e build."
        action={
          <button
            type="button"
            className="cosmo-saas__btn"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        }
      />

      <div className="cosmo-saas__grid cosmo-saas__grid--3">
        <div className="cosmo-saas__stat">
          <div className="cosmo-saas__stat-label">Versão</div>
          <div className="cosmo-saas__stat-value">
            {data?.appVersion ?? "—"}
          </div>
        </div>
        <div className="cosmo-saas__stat">
          <div className="cosmo-saas__stat-label">Build</div>
          <div className="cosmo-saas__stat-value">{data?.buildMode ?? "—"}</div>
        </div>
        <div className="cosmo-saas__stat">
          <div className="cosmo-saas__stat-label">Verificado em</div>
          <div className="cosmo-saas__stat-value" style={{ fontSize: "1rem" }}>
            {data?.checkedAt
              ? new Date(data.checkedAt).toLocaleString("pt-BR")
              : "—"}
          </div>
        </div>
      </div>

      <section className="cosmo-saas__panel">
        <h2 className="cosmo-saas__title">Status dos serviços</h2>
        {isLoading ? (
          <p className="cosmo-saas__muted mt-3">Coletando diagnóstico…</p>
        ) : (
          <div className="mt-3 space-y-3">
            {data?.checks.map((check) => (
              <div
                key={check.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {check.label}
                  </p>
                  <p className="cosmo-saas__desc">{check.detail}</p>
                </div>
                <span className={badgeClass(check.status)}>{check.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
