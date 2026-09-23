import { Clock } from "lucide-react";
import type { MenuStoreStatus, MenuStoreTone } from "../core/storeStatus";
import type { MenuTheme } from "../types/digitalMenu.types";
import { radiusToCss } from "../theme/menuTheme";

interface MenuStoreStatusBadgeProps {
  status: MenuStoreStatus;
  theme: MenuTheme;
}

function toneColor(theme: MenuTheme, tone: MenuStoreTone): string {
  switch (tone) {
    case "positive":
      return theme.successColor;
    case "warning":
      return theme.warningColor;
    default:
      return theme.mutedTextColor;
  }
}

export default function MenuStoreStatusBadge({
  status,
  theme,
}: MenuStoreStatusBadgeProps) {
  if (status.availability === "unknown") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
        style={{
          backgroundColor: theme.surfaceMuted,
          color: theme.textColor,
          borderRadius: radiusToCss(theme.buttonRadius),
          border: `1px solid ${theme.borderColor}`,
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: toneColor(theme, status.tone) }}
          aria-hidden="true"
        />
        {status.label}
      </span>

      {status.detail && (
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: theme.mutedTextColor }}
        >
          {status.availability === "open" && (
            <Clock className="h-3 w-3" aria-hidden="true" />
          )}
          {status.detail}
        </span>
      )}
    </div>
  );
}
