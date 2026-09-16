import type { ReactNode } from "react";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { useMenuTheme } from "../menu/hooks/useMenuTheme";

interface DigitalOrderingLayoutProps {
  store: DigitalStoreSettings | null;
  children: ReactNode;
  footer?: ReactNode;
}

export default function DigitalOrderingLayout({
  store,
  children,
  footer,
}: DigitalOrderingLayoutProps) {
  const { theme } = useMenuTheme(store);

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(160deg, ${theme.backgroundColor} 0%, #020617 100%)`,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-28 pt-5 sm:max-w-xl sm:px-5 md:max-w-2xl">
        {children}
        {footer}
      </div>
    </div>
  );
}
