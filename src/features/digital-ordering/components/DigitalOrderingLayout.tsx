import type { ReactNode } from "react";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { useMenuTheme } from "../menu/hooks/useMenuTheme";
import {
  canvasBackgroundFor,
  contentWidthClass,
  menuThemeStyle,
} from "../menu/theme/menuTheme";

interface DigitalOrderingLayoutProps {
  store: DigitalStoreSettings | null;
  children: ReactNode;
  footer?: ReactNode;
  /** Compact chrome for admin live preview frames. */
  embedded?: boolean;
}

export default function DigitalOrderingLayout({
  store,
  children,
  footer,
  embedded = false,
}: DigitalOrderingLayoutProps) {
  const { theme } = useMenuTheme(store);

  return (
    <div
      className={embedded ? "h-full min-h-0" : "min-h-screen"}
      style={{
        ...menuThemeStyle(theme),
        background: canvasBackgroundFor(theme),
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        fontSize: "var(--digital-font-size)",
      }}
    >
      <div
        className={
          embedded
            ? "mx-auto flex h-full w-full flex-col px-3 pb-24 pt-3"
            : `mx-auto flex min-h-screen w-full flex-col px-4 pb-28 pt-5 sm:px-5 lg:px-8 ${contentWidthClass(theme)}`
        }
      >
        {children}
        {footer}
      </div>
    </div>
  );
}
