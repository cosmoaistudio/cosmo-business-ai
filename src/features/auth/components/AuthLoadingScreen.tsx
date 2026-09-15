import { useLayoutEffect } from "react";

import { CosmoVoid } from "@/components/auth-experience/BrandUniverse";
import { CosmoCore } from "@/components/auth-experience/CosmoCore";
import "@/components/auth-experience/styles/brand-experience.css";
import { notifyDesktopVisualReady } from "@/lib/notifyDesktopVisualReady";

export default function AuthLoadingScreen() {
  useLayoutEffect(() => {
    // Sync notify — hidden BrowserWindows throttle rAF/timers
    notifyDesktopVisualReady("AuthLoadingScreen");
  }, []);

  return (
    <div className="cosmo-auth-loading">
      <CosmoVoid introPhase={6} />
      <div className="cosmo-auth-loading__panel cosmo-loading-official">
        <CosmoCore size={73} interactive={false} introComplete />
        <p className="cosmo-loading-official__label">Preparando o universo...</p>
        <div className="cosmo-loading-official__track">
          <div className="cosmo-loading-official__bar cosmo-auth-loading__bar" />
        </div>
        <p className="sr-only">Verificando autenticação...</p>
      </div>
    </div>
  );
}
