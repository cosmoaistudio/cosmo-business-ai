import { useMemo } from "react";
import { digitalStoreService } from "@/features/digital-ordering/services/digitalStore.service";
import { buildDefaultSettings } from "@/features/digital-ordering/utils/digitalStoreMappers";
import { buildQrCodeImageUrl } from "@/features/digital-ordering/utils/qrCodeUrls";
import type { OnboardingState } from "../../types/onboarding";

interface StepProps {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step8DigitalMenu({ state, onChange }: StepProps) {
  const settings = useMemo(
    () =>
      buildDefaultSettings(state.organizationId, state.company.companyName),
    [state.organizationId, state.company.companyName]
  );

  const qrCodes = useMemo(() => {
    const tables = state.tables.map((t) => ({
      id: t.id,
      label: t.label,
      seats: t.seats,
    }));
    const mergedSettings = {
      ...settings,
      slug: state.digitalMenu.slug,
      organizationName: state.company.companyName,
    };
    return digitalStoreService.buildQrCodes(mergedSettings, tables);
  }, [settings, state.tables, state.digitalMenu.slug, state.company.companyName]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Configure o cardápio digital. Os QR Codes serão gerados automaticamente
        para retirada, delivery e mesas.
      </p>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Slug da loja (URL pública)
        </span>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-slate-400">/menu/</span>
          <input
            className="cosmo-input flex-1"
            value={state.digitalMenu.slug}
            onChange={(e) =>
              onChange({
                digitalMenu: {
                  ...state.digitalMenu,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-"),
                },
              })
            }
          />
        </div>
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {qrCodes.slice(0, 6).map((entry) => (
          <div
            key={`${entry.type}-${entry.tableId ?? entry.label}`}
            className="rounded-2xl border border-slate-200 p-4 text-center"
          >
            <p className="font-semibold text-slate-900">{entry.label}</p>
            <img
              src={buildQrCodeImageUrl(entry.url, 160)}
              alt={`QR ${entry.label}`}
              className="mx-auto mt-3 rounded-xl"
              width={160}
              height={160}
            />
            <p className="mt-2 truncate text-xs text-slate-500">{entry.url}</p>
          </div>
        ))}
      </div>

      {qrCodes.length > 6 && (
        <p className="text-center text-sm text-slate-500">
          + {qrCodes.length - 6} QR Code(s) adicional(is) para mesas
        </p>
      )}
    </div>
  );
}

export function Step10Checklist({ state }: { state: OnboardingState }) {
  const items = [
    {
      label: "Empresa configurada",
      done: state.completedSteps.includes(1) || !!state.company.companyName,
    },
    {
      label: "Contato informado",
      done:
        state.completedSteps.includes(2) ||
        !!(state.contact.phone || state.contact.whatsapp),
    },
    {
      label: "Mesas (opcional)",
      done: state.completedSteps.includes(3),
    },
    {
      label: "Categorias definidas",
      done: state.categories.length > 0,
    },
    {
      label: "Produtos cadastrados",
      done:
        state.products.some((p) => p.created) || state.completedSteps.includes(5),
    },
    {
      label: "Impressora / Desktop",
      done:
        state.printer.printerConfigured || state.printer.desktopAgentReady,
    },
    {
      label: "Kitchen Display",
      done: state.kitchen.configured || state.completedSteps.includes(7),
    },
    {
      label: "Cardápio digital + QR",
      done: state.digitalMenu.qrGenerated || state.completedSteps.includes(8),
    },
    {
      label: "Mobile conectado",
      done: state.mobile.mobileConnected || state.completedSteps.includes(9),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
        <p className="text-sm opacity-90">Checklist final</p>
        <p className="mt-1 text-3xl font-black">
          {doneCount}/{items.length} concluído(s)
        </p>
        <p className="mt-2 text-sm opacity-90">
          {doneCount >= 7
            ? "Sistema pronto para operar!"
            : "Complete os itens pendentes para a melhor experiência."}
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              item.done
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                item.done ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                item.done ? "text-emerald-800" : "text-slate-600"
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
