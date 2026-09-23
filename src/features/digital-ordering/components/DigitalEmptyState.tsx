import type { ReactNode } from "react";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import { DEFAULT_MENU_THEME, radiusToCss } from "../menu/theme/menuTheme";

interface DigitalEmptyStateProps {
  theme?: MenuTheme | null;
  message: string;
  children?: ReactNode;
}

export default function DigitalEmptyState({
  theme = DEFAULT_MENU_THEME,
  message,
  children,
}: DigitalEmptyStateProps) {
  const resolved = theme ?? DEFAULT_MENU_THEME;

  return (
    <div
      className="border border-dashed px-6 py-10 text-center"
      style={{
        backgroundColor: resolved.surfaceColor,
        borderColor: resolved.borderColor,
        borderRadius: radiusToCss(resolved.cardRadius),
        color: resolved.mutedTextColor,
        fontFamily: resolved.fontFamily,
      }}
    >
      <p className="text-sm">{message}</p>
      {children}
    </div>
  );
}
