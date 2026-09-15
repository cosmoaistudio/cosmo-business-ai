import type { ReactNode } from "react";
import type { DigitalStoreSettings } from "../types/digitalStore.types";

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
  const theme = store?.theme;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `linear-gradient(160deg, ${theme?.backgroundColor ?? "#0f172a"} 0%, #020617 100%)`,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-24 pt-6 sm:px-6">
        {children}
        {footer}
      </div>
    </div>
  );
}
