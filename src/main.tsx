import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { notifyDesktopVisualReady } from "@/lib/notifyDesktopVisualReady";

const perfEnabled = import.meta.env.DEV || import.meta.env.VITE_COSMO_PERF === "1";
const bootT0 =
  typeof performance !== "undefined" ? performance.now() : Date.now();

function perfLog(event: string) {
  if (!perfEnabled) return;
  console.info(`[Cosmo Performance] ${event}`);
}

function startupMs() {
  return Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      bootT0
  );
}

perfLog("startup");
console.info("[Cosmo Renderer] React bootstrap start");
console.info(`[Cosmo Startup] React bootstrap +${startupMs()}ms`);
console.info("[Cosmo] React iniciado");

const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[Cosmo] ✖ #root não encontrado — renderer não pode montar");
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Backup visual-ready if boot-shell IPC was missed (sync — no rAF; hidden windows throttle timers)
if (window.cosmoDesktop?.isDesktop) {
  notifyDesktopVisualReady("react-module-loaded");
}

requestAnimationFrame(() => {
  console.info("[Cosmo] React renderizado");
  console.info("[Cosmo Renderer] first React commit");
  console.info(`[Cosmo Startup] renderer-ready +${startupMs()}ms`);
  perfLog("renderer-ready");
  if (window.cosmoDesktop?.isDesktop) {
    console.info("[Cosmo] Desktop bridge OK (preload/contextBridge)");
    notifyDesktopVisualReady("react-first-paint");
  }
});

if (perfEnabled && typeof PerformanceObserver !== "undefined") {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          console.info(
            `[Cosmo Performance] first-contentful-paint — ${Math.round(entry.startTime)}ms`
          );
          observer.disconnect();
        }
      }
    });
    observer.observe({ type: "paint", buffered: true });
  } catch {
    // PerformanceObserver paint may be unavailable in some environments
  }
}
