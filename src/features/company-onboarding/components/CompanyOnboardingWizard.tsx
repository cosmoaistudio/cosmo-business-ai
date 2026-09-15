import { BUSINESS_TYPES } from "../types";
import { useCompanyOnboarding } from "../hooks/useCompanyOnboarding";
import "../styles/company-onboarding.css";

const STEP_LABELS = ["Seu negócio", "Contato", "Finalizar"] as const;

export function CompanyOnboardingWizard() {
  const {
    step,
    form,
    error,
    submitting,
    patchForm,
    goNext,
    goBack,
    submit,
    signOut,
  } = useCompanyOnboarding();

  return (
    <div className="company-onboarding">
      <div className="company-onboarding__aurora" aria-hidden />
      <div className="company-onboarding__scroll">
        <div className="company-onboarding__panel">
          <p className="company-onboarding__brand">COSMO</p>
          <h1 className="company-onboarding__title">
            Configure seu negócio em minutos
          </h1>
          <p className="company-onboarding__subtitle">
            Conte um pouco sobre sua empresa para personalizarmos sua
            experiência.
          </p>

          <div className="company-onboarding__steps" aria-label="Progresso">
            {STEP_LABELS.map((label, index) => {
              const n = (index + 1) as 1 | 2 | 3;
              const state =
                n < step ? "done" : n === step ? "active" : "idle";
              return (
                <div
                  key={label}
                  className={`company-onboarding__step company-onboarding__step--${state}`}
                >
                  <span className="company-onboarding__step-dot">{n}</span>
                  <span className="company-onboarding__step-label">{label}</span>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div>
              <label className="company-onboarding__field">
                <span className="company-onboarding__label">
                  Nome da empresa *
                </span>
                <input
                  className="company-onboarding__input"
                  value={form.name}
                  onChange={(e) => patchForm({ name: e.target.value })}
                  placeholder="Ex: Cosmo Burger"
                  autoFocus
                />
              </label>

              <label className="company-onboarding__field">
                <span className="company-onboarding__label">
                  Tipo de negócio *
                </span>
                <select
                  className="company-onboarding__select"
                  value={form.businessType}
                  onChange={(e) => patchForm({ businessType: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <div className="company-onboarding__chips" role="list">
                {BUSINESS_TYPES.slice(0, 6).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`company-onboarding__chip${
                      form.businessType === type
                        ? " company-onboarding__chip--active"
                        : ""
                    }`}
                    onClick={() => patchForm({ businessType: type })}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <label className="company-onboarding__field" style={{ marginTop: "1rem" }}>
                <span className="company-onboarding__label">Segmento *</span>
                <input
                  className="company-onboarding__input"
                  value={form.segment}
                  onChange={(e) => patchForm({ segment: e.target.value })}
                  placeholder="Ex: Fast food, delivery, cafeteria…"
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="company-onboarding__field">
                <span className="company-onboarding__label">Cidade</span>
                <input
                  className="company-onboarding__input"
                  value={form.city}
                  onChange={(e) => patchForm({ city: e.target.value })}
                  placeholder="Ex: São Paulo"
                  autoFocus
                />
              </label>

              <label className="company-onboarding__field">
                <span className="company-onboarding__label">WhatsApp</span>
                <input
                  className="company-onboarding__input"
                  value={form.whatsapp}
                  onChange={(e) => patchForm({ whatsapp: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                  inputMode="tel"
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="company-onboarding__field">
                <span className="company-onboarding__label">
                  URL do logo (opcional)
                </span>
                <input
                  className="company-onboarding__input"
                  value={form.logoUrl}
                  onChange={(e) => patchForm({ logoUrl: e.target.value })}
                  placeholder="https://…"
                />
                <p className="company-onboarding__hint">
                  Você pode adicionar o logo depois nas configurações.
                </p>
              </label>

              <div className="company-onboarding__summary">
                <div className="company-onboarding__summary-row">
                  <span>Empresa</span>
                  <span>{form.name || "—"}</span>
                </div>
                <div className="company-onboarding__summary-row">
                  <span>Tipo</span>
                  <span>{form.businessType || "—"}</span>
                </div>
                <div className="company-onboarding__summary-row">
                  <span>Segmento</span>
                  <span>{form.segment || "—"}</span>
                </div>
                <div className="company-onboarding__summary-row">
                  <span>Cidade</span>
                  <span>{form.city || "—"}</span>
                </div>
                <div className="company-onboarding__summary-row">
                  <span>WhatsApp</span>
                  <span>{form.whatsapp || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {error ? (
            <p className="company-onboarding__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="company-onboarding__actions">
            {step > 1 ? (
              <button
                type="button"
                className="company-onboarding__btn company-onboarding__btn--ghost"
                onClick={goBack}
                disabled={submitting}
              >
                Voltar
              </button>
            ) : null}

            {step < 3 ? (
              <button
                type="button"
                className="company-onboarding__btn company-onboarding__btn--primary"
                onClick={goNext}
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                className="company-onboarding__btn company-onboarding__btn--primary"
                onClick={() => void submit()}
                disabled={submitting}
              >
                {submitting ? "Criando…" : "Criar meu negócio"}
              </button>
            )}
          </div>

          <div className="company-onboarding__footer">
            <button
              type="button"
              className="company-onboarding__link"
              onClick={() => void signOut()}
              disabled={submitting}
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
