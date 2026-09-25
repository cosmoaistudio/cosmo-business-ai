import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./features/digital-ordering/styles/digital-ordering.css";
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

function renderMissingPublicEnv(root: HTMLElement) {
  const shell =
    document.getElementById("cosmo-boot-shell") ?? root;
  shell.setAttribute("aria-busy", "false");
  shell.innerHTML = `
    <div style="max-width:28rem;padding:1.5rem;text-align:center;">
      <p style="margin:0 0 0.75rem;font-size:0.75rem;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Cosmo Business AI</p>
      <h1 style="margin:0 0 0.75rem;font-size:1.25rem;font-weight:700;color:#f8fafc;">Variáveis do Supabase não configuradas</h1>
      <p style="margin:0;font-size:0.9375rem;line-height:1.55;color:#cbd5e1;">
        O aplicativo não iniciou porque <code style="color:#e2e8f0;">VITE_SUPABASE_URL</code>
        e/ou <code style="color:#e2e8f0;">VITE_SUPABASE_PUBLISHABLE_KEY</code> estão ausentes no build.
        Configure essas variáveis públicas no painel da Vercel
        (Settings → Environment Variables, Production e Preview)
        e faça um novo deploy para o Vite embuti-las.
      </p>
    </div>
  `;
}

async function boot() {
  perfLog("startup");
  console.info("[Cosmo Renderer] React bootstrap start");
  console.info(`[Cosmo Startup] React bootstrap +${startupMs()}ms`);
  console.info("[Cosmo] React iniciado");

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("[Cosmo] ✖ #root não encontrado — renderer não pode montar");
    throw new Error("Root element #root not found");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
    console.error(
      "[Cosmo] VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias no build (Vercel → Environment Variables → Redeploy)."
    );
    renderMissingPublicEnv(rootEl);
    return;
  }

  const { default: App } = await import("./App.tsx");

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
}

void boot();
