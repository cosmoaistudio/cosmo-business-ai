import type { ReactNode } from "react";

import { CosmicBackground } from "@/design-system";
import "@/design-system/styles/design-system.css";
import "@/design-system/styles/cosmo-official.css";
import "@/design-system/styles/cosmo-contrast-fix.css";
import "@/design-system/styles/cosmo-modal.css";
import "@/features/dashboard/styles/cosmo-os.css";

import { CosmoAiProvider } from "@/features/cosmo-ai";

import { CosmoAiDrawerProvider } from "../ai/CosmoAiDrawerContext";
import FloatingAssistDock from "./FloatingAssistDock";
import { OverlayPresenceProvider } from "./OverlayPresenceContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <CosmoAiProvider>
      <CosmoAiDrawerProvider>
        <OverlayPresenceProvider>
          <div
            className="relative flex h-screen overflow-hidden text-slate-100"
            data-cosmo-ds="v2"
            data-theme="dark"
          >
            <CosmicBackground intensity="subtle" />

            <Sidebar />

            <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
              <Topbar />

              <main className="cosmo-main-surface flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>

            <FloatingAssistDock />
          </div>
        </OverlayPresenceProvider>
      </CosmoAiDrawerProvider>
    </CosmoAiProvider>
  );
}
