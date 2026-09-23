import type { DigitalOrderMode } from "../../types/digitalStore.types";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import type { MenuTheme } from "../types/digitalMenu.types";
import type { MenuStoreStatus } from "../core/storeStatus";
import { buildStoreMetaItems } from "../core/storeMeta";
import { radiusToCss } from "../theme/menuTheme";
import MenuStoreStatusBadge from "./MenuStoreStatus";

interface MenuStoreMetaProps {
  store: DigitalStoreSettings;
  mode: DigitalOrderMode;
  status: MenuStoreStatus;
  theme: MenuTheme;
  compact?: boolean;
}

export default function MenuStoreMeta({
  store,
  mode,
  status,
  theme,
  compact = false,
}: MenuStoreMetaProps) {
  const items = buildStoreMetaItems(store, mode, status);
  const statusForBadge =
    items.some((item) => item.id === "eta") && status.availability === "open"
      ? { ...status, detail: null }
      : status;

  if (statusForBadge.availability === "unknown" && items.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-1.5 ${
        compact ? "justify-start" : ""
      }`}
      data-menu-store-meta=""
      aria-label="Informações da loja"
    >
      <MenuStoreStatusBadge status={statusForBadge} theme={theme} />

      {items.map((item) => (
        <span
          key={item.id}
          data-store-meta={item.id}
          className="inline-flex max-w-full items-center gap-1 truncate px-2.5 py-1 text-[11px] font-medium sm:text-xs"
          style={{
            backgroundColor: theme.surfaceMuted,
            color: theme.mutedTextColor,
            borderRadius: radiusToCss(theme.buttonRadius),
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <span className="truncate">
            {item.label}
            <span aria-hidden="true"> · </span>
            <span style={{ color: theme.textColor }}>{item.value}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
