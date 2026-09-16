import { useMemo } from "react";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { DIGITAL_ORDER_MODE_LABELS } from "../types/digitalOrdering.types";
import type { DigitalOrderMode } from "../types/digitalStore.types";
import MenuBanner from "../menu/components/MenuBanner";
import MenuStoreStatusBadge from "../menu/components/MenuStoreStatus";
import { resolveStoreStatus } from "../menu/core/storeStatus";
import { useMenuTheme } from "../menu/hooks/useMenuTheme";
import { radiusToCss } from "../menu/theme/menuTheme";

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
  const { theme } = useMenuTheme(store);

  const status = useMemo(
    () => resolveStoreStatus(store, mode ?? "pickup"),
    [store, mode]
  );

  return (
    <header
      className="mb-6 overflow-hidden border backdrop-blur-xl"
      style={{
        backgroundColor: theme.surfaceColor,
        borderColor: theme.borderColor,
        borderRadius: radiusToCss(theme.cardRadius),
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <MenuBanner
        imageUrl={store.bannerUrl}
        message={store.bannerMessage}
        storeName={store.organizationName}
        theme={theme}
      />

      <div className="flex items-start gap-4 p-5">
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={store.organizationName}
            loading="eager"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-2xl border object-cover"
            style={{ borderColor: theme.borderColor }}
          />
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ backgroundColor: theme.primaryColor }}
            aria-hidden="true"
          >
            {store.organizationName.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-xl font-bold sm:text-2xl"
            style={{ fontFamily: theme.headingFontFamily }}
          >
            {store.organizationName}
          </h1>

          <p className="mt-1 text-sm" style={{ color: theme.mutedTextColor }}>
            {store.welcomeMessage}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <MenuStoreStatusBadge status={status} theme={theme} />

            {mode && (
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: theme.borderColor,
                  color: theme.textColor,
                }}
              >
                {DIGITAL_ORDER_MODE_LABELS[mode]}
                {tableLabel ? ` · ${tableLabel}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
