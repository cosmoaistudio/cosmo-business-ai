import type { OnboardingState } from "../../types/onboarding";
import { BUSINESS_SEGMENT_LABELS } from "../../types/onboarding";

interface StepProps {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step1Company({ state, onChange }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="sm:col-span-2 block">
        <span className="text-sm font-semibold text-slate-700">Nome da empresa</span>
        <input
          className="cosmo-input mt-2 w-full"
          value={state.company.companyName}
          onChange={(e) =>
            onChange({
              company: { ...state.company, companyName: e.target.value },
            })
          }
          placeholder="Ex: Cosmo Burger"
        />
      </label>

      <label className="sm:col-span-2 block">
        <span className="text-sm font-semibold text-slate-700">URL do logo (opcional)</span>
        <input
          className="cosmo-input mt-2 w-full"
          value={state.company.logoUrl}
          onChange={(e) =>
            onChange({
              company: { ...state.company, logoUrl: e.target.value },
            })
          }
          placeholder="https://..."
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Cor primária</span>
        <div className="mt-2 flex gap-2">
          <input
            type="color"
            value={state.company.primaryColor}
            onChange={(e) =>
              onChange({
                company: { ...state.company, primaryColor: e.target.value },
              })
            }
            className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200"
          />
          <input
            className="cosmo-input flex-1"
            value={state.company.primaryColor}
            onChange={(e) =>
              onChange({
                company: { ...state.company, primaryColor: e.target.value },
              })
            }
          />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Cor secundária</span>
        <div className="mt-2 flex gap-2">
          <input
            type="color"
            value={state.company.secondaryColor}
            onChange={(e) =>
              onChange({
                company: { ...state.company, secondaryColor: e.target.value },
              })
            }
            className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200"
          />
          <input
            className="cosmo-input flex-1"
            value={state.company.secondaryColor}
            onChange={(e) =>
              onChange({
                company: { ...state.company, secondaryColor: e.target.value },
              })
            }
          />
        </div>
      </label>

      <label className="sm:col-span-2 block">
        <span className="text-sm font-semibold text-slate-700">Segmento</span>
        <select
          className="cosmo-input mt-2 w-full"
          value={state.company.segment}
          onChange={(e) =>
            onChange({
              company: {
                ...state.company,
                segment: e.target.value as OnboardingState["company"]["segment"],
              },
            })
          }
        >
          {Object.entries(BUSINESS_SEGMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div
        className="sm:col-span-2 rounded-2xl p-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${state.company.primaryColor}, ${state.company.secondaryColor})`,
        }}
      >
        <p className="text-sm opacity-80">Pré-visualização</p>
        <p className="mt-1 text-2xl font-black">{state.company.companyName || "Sua marca"}</p>
      </div>
    </div>
  );
}

export function Step2Contact({ state, onChange }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="sm:col-span-2 block">
        <span className="text-sm font-semibold text-slate-700">Endereço</span>
        <input
          className="cosmo-input mt-2 w-full"
          value={state.contact.address}
          onChange={(e) =>
            onChange({ contact: { ...state.contact, address: e.target.value } })
          }
          placeholder="Rua, número, bairro, cidade"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Telefone</span>
        <input
          className="cosmo-input mt-2 w-full"
          value={state.contact.phone}
          onChange={(e) =>
            onChange({ contact: { ...state.contact, phone: e.target.value } })
          }
          placeholder="(11) 3333-4444"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">WhatsApp</span>
        <input
          className="cosmo-input mt-2 w-full"
          value={state.contact.whatsapp}
          onChange={(e) =>
            onChange({ contact: { ...state.contact, whatsapp: e.target.value } })
          }
          placeholder="(11) 99999-8888"
        />
      </label>

      <label className="sm:col-span-2 block">
        <span className="text-sm font-semibold text-slate-700">Instagram</span>
        <input
          className="cosmo-input mt-2 w-full"
          value={state.contact.instagram}
          onChange={(e) =>
            onChange({ contact: { ...state.contact, instagram: e.target.value } })
          }
          placeholder="@suaempresa"
        />
      </label>
    </div>
  );
}
