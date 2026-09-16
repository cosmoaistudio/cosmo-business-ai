import { Clock } from "lucide-react";
import type { MenuStoreStatus, MenuStoreTone } from "../core/storeStatus";
import type { MenuTheme } from "../types/digitalMenu.types";

interface MenuStoreStatusBadgeProps {
  status: MenuStoreStatus;
  theme: MenuTheme;
}

const TONE_DOT: Record<MenuStoreTone, string> = {
  positive: "#22c55e",
  warning: "#f59e0b",
  neutral: "#94a3b8",
};

export default function MenuStoreStatusBadge({
  status,
  theme,
}: MenuStoreStatusBadgeProps) {
  if (status.availability === "unknown") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: theme.surfaceColor, color: theme.textColor }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: TONE_DOT[status.tone] }}
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
