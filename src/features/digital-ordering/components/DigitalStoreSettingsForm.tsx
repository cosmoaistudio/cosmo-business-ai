import type {
  DigitalStoreSettings,
  DigitalStoreTable,
} from "../types/digitalStore.types";

interface DigitalStoreSettingsFormProps {
  settings: DigitalStoreSettings;
  tables: DigitalStoreTable[];
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onTablesChange: (tables: DigitalStoreTable[]) => void;
}

export default function DigitalStoreSettingsForm({
  settings,
  tables,
  onChange,
  onTablesChange,
}: DigitalStoreSettingsFormProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Slug da loja
          </span>
          <input
            value={settings.slug}
            onChange={(event) => onChange({ slug: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Tempo médio (min)
          </span>
          <input
            type="number"
            min={1}
            value={settings.averagePrepMinutes}
            onChange={(event) =>
              onChange({ averagePrepMinutes: Number(event.target.value) })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Mensagem inicial
          </span>
          <textarea
            value={settings.welcomeMessage}
            onChange={(event) => onChange({ welcomeMessage: event.target.value })}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Logo URL
          </span>
          <input
            value={settings.logoUrl ?? ""}
            onChange={(event) => onChange({ logoUrl: event.target.value || null })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Banner URL
          </span>
          <input
            value={settings.bannerUrl ?? ""}
            onChange={(event) => onChange({ bannerUrl: event.target.value || null })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={settings.acceptsDineIn}
            onChange={(event) => onChange({ acceptsDineIn: event.target.checked })}
          />
          <span className="text-sm">Aceita mesa</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={settings.acceptsPickup}
            onChange={(event) => onChange({ acceptsPickup: event.target.checked })}
          />
          <span className="text-sm">Aceita retirada</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={settings.acceptsDelivery}
            onChange={(event) => onChange({ acceptsDelivery: event.target.checked })}
          />
          <span className="text-sm">Aceita delivery</span>
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Pedido mínimo (R$)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={settings.minimumOrder}
            onChange={(event) =>
              onChange({ minimumOrder: Number(event.target.value) })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Taxa de entrega (R$)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={settings.deliveryFee}
            onChange={(event) =>
              onChange({ deliveryFee: Number(event.target.value) })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {(["primaryColor", "secondaryColor", "accentColor", "backgroundColor"] as const).map(
          (key) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm font-medium capitalize text-slate-700">
                {key.replace("Color", "")}
              </span>
              <input
                type="color"
                value={settings.theme[key]}
                onChange={(event) =>
                  onChange({
                    theme: { ...settings.theme, [key]: event.target.value },
                  })
                }
                className="h-12 w-full rounded-2xl border border-slate-200"
              />
            </label>
          )
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Mesas</h3>
        <div className="space-y-2">
          {tables.map((table, index) => (
            <div key={table.id} className="flex gap-2">
              <input
                value={table.label}
                onChange={(event) => {
                  const next = [...tables];
                  next[index] = { ...table, label: event.target.value };
                  onTablesChange(next);
                }}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2"
              />
              <input
                type="number"
                min={1}
                value={table.seats}
                onChange={(event) => {
                  const next = [...tables];
                  next[index] = { ...table, seats: Number(event.target.value) };
                  onTablesChange(next);
                }}
                className="w-24 rounded-2xl border border-slate-200 px-4 py-2"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
