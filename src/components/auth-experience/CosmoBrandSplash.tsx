import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { isDesktopApp } from "@/desktop/types";

import { CosmoVoid } from "./BrandUniverse";
import { CosmoCore } from "./CosmoCore";
import { useBrandIntro } from "./hooks/useBrandIntro";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Web: full premium splash (Electron owns splash on desktop). */
const SPLASH_MIN_MS = 1800;
const SPLASH_TARGET_MS = 2000;
const SPLASH_MAX_MS = 3000;
const SPLASH_EXIT_MS = 280;

interface CosmoBrandSplashProps {
  children: ReactNode;
}

function isRendererReady() {
  return (
    typeof document !== "undefined" &&
    (document.readyState === "interactive" ||
      document.readyState === "complete")
  );
}

/**
 * app-ready (renderer): document interactive + double rAF (first paint).
 * Does NOT wait on Supabase, network, hardware, or agent.
 */
function waitForAppReady(signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      if (!signal.cancelled) resolve();
    };

    if (isRendererReady()) {
      requestAnimationFrame(() => requestAnimationFrame(done));
      return;
    }

    const onReady = () => {
      document.removeEventListener("DOMContentLoaded", onReady);
      requestAnimationFrame(() => requestAnimationFrame(done));
    };
    document.addEventListener("DOMContentLoaded", onReady);
  });
}

export function CosmoBrandSplash({ children }: CosmoBrandSplashProps) {
  const desktop = isDesktopApp();
  // Desktop: Electron native splash already held ~1.8–2.2s — do not stack another wait.
  const [loading, setLoading] = useState(() => !desktop);
  const startedAt = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now()
  );
  const { phase, coreVisible, glowActive, formVisible } = useBrandIntro({
    compact: false,
  });

  useEffect(() => {
    if (desktop) return;

    const signal = { cancelled: false };
    let maxTimer = 0;
    let pollTimer = 0;

    const finish = () => {
      if (signal.cancelled) return;
      signal.cancelled = true;
      window.clearTimeout(maxTimer);
      window.clearTimeout(pollTimer);
      setLoading(false);
    };

    const tryFinish = (appReady: boolean) => {
      const elapsed =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        startedAt.current;

      if (elapsed >= SPLASH_MAX_MS) {
        finish();
        return;
      }

      if (appReady && elapsed >= SPLASH_MIN_MS) {
        if (elapsed < SPLASH_TARGET_MS) {
          pollTimer = window.setTimeout(
            () => tryFinish(true),
            SPLASH_TARGET_MS - elapsed
          );
          return;
        }
        finish();
      }
    };

    void waitForAppReady(signal).then(() => tryFinish(true));
    maxTimer = window.setTimeout(() => finish(), SPLASH_MAX_MS);
    pollTimer = window.setTimeout(() => {
      tryFinish(isRendererReady());
    }, SPLASH_MIN_MS);

    return () => {
      signal.cancelled = true;
      window.clearTimeout(maxTimer);
      window.clearTimeout(pollTimer);
    };
  }, [desktop]);

  return (
    <>
      <AnimatePresence>
        {loading ? (
          <motion.div
            className="cosmo-brand-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SPLASH_EXIT_MS / 1000, ease: EASE_OUT }}
          >
            <CosmoVoid introPhase={phase} />

            <div className="cosmo-brand-splash__center">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={
                  coreVisible
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.85 }
                }
                transition={{ duration: 0.7, ease: EASE_OUT }}
              >
                <CosmoCore
                  size={120}
                  interactive={false}
                  introComplete={glowActive}
                />
              </motion.div>

              <motion.h1
                className="cosmo-brand-splash__word"
                initial={{ opacity: 0, letterSpacing: "0.42em" }}
                animate={
                  glowActive
                    ? { opacity: 1, letterSpacing: "0.28em" }
                    : { opacity: 0, letterSpacing: "0.42em" }
                }
                transition={{ duration: 0.55, ease: EASE_OUT }}
              >
                COSMO
              </motion.h1>

              <motion.p
                className="cosmo-brand-splash__tagline"
                initial={{ opacity: 0 }}
                animate={glowActive ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                Business AI
              </motion.p>

              <motion.div
                className="cosmo-loading-official"
                initial={{ opacity: 0 }}
                animate={formVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="cosmo-loading-official__label">
                  Preparando o universo...
                </p>
                <div className="cosmo-loading-official__track">
                  <motion.div
                    className="cosmo-loading-official__bar"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: SPLASH_TARGET_MS / 1000 - 0.35,
                      ease: EASE_OUT,
                    }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* Keep children mounted — Dashboard is not remounted after splash */}
      <div
        className="cosmo-brand-splash__app"
        style={{
          visibility: loading ? "hidden" : "visible",
          pointerEvents: loading ? "none" : "auto",
        }}
        aria-hidden={loading || undefined}
      >
        {children}
      </div>
    </>
  );
}

/** @deprecated */
export const CosmoSplashV2 = CosmoBrandSplash;
