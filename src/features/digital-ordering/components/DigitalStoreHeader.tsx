import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { DIGITAL_ORDER_MODE_LABELS } from "../types/digitalOrdering.types";
import type { DigitalOrderMode } from "../types/digitalStore.types";

interface DigitalStoreHeaderProps {
  store: DigitalStoreSettings;
  mode?: DigitalOrderMode;
  tableLabel?: string;
}

export default function DigitalStoreHeader({
  store,
  mode,
  tableLabel,
}: DigitalStoreHeaderProps) {
  return (
    <header className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
      {store.bannerUrl ? (
        <img
          src={store.bannerUrl}
          alt=""
          className="h-36 w-full object-cover"
        />
      ) : (
        <div
          className="h-28 w-full"
          style={{
            background: `linear-gradient(135deg, ${store.theme.primaryColor}, ${store.theme.secondaryColor})`,
          }}
        />
      )}

      <div className="flex items-start gap-4 p-5">
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={store.organizationName}
            className="h-16 w-16 rounded-2xl border border-white/20 object-cover"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
            style={{ backgroundColor: store.theme.primaryColor }}
          >
            {store.organizationName.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{store.organizationName}</h1>
          <p className="mt-1 text-sm text-slate-300">{store.welcomeMessage}</p>
          {mode && (
            <p className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              {DIGITAL_ORDER_MODE_LABELS[mode]}
              {tableLabel ? ` · ${tableLabel}` : ""}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
