import { useId } from "react";

import { COSMO_C_PATH } from "@/components/auth-experience/cosmoMarkPath";
import { usePrefersReducedMotion } from "@/components/auth-experience/hooks/usePrefersReducedMotion";

/**
 * Login brand mark — SVG path only (no <canvas>, no CSS filter).
 * Canvas / filter / transform layers composite as a visible rectangle in Chromium/Electron.
 */
export function LoginCosmoMark() {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="login-mark">
      {/* Circular glows: static CSS (no framer transform/opacity — avoids rectangular GPU layer) */}
      <div className="login-mark__volume" aria-hidden />
      <div className="login-mark__halo login-mark__halo--outer" aria-hidden />
      <div className="login-mark__halo login-mark__halo--mid" aria-hidden />

      <div className="login-mark__glass">
        <svg className="login-mark__svg" viewBox="0 0 144 144" aria-hidden>
          <defs>
            <linearGradient
              id={`${uid}-glass`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="40%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient
              id={`${uid}-inner`}
              x1="0%"
              y1="100%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(34,211,238,0.85)" />
              <stop offset="50%" stopColor="rgba(99,102,241,0.65)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.45)" />
            </linearGradient>
          </defs>

          {/* Soft glow via wider translucent strokes — never CSS filter */}
          <path
            d={COSMO_C_PATH}
            fill="none"
            stroke={`url(#${uid}-glass)`}
            strokeWidth="22"
            strokeLinecap="round"
            opacity="0.14"
          />
          <path
            d={COSMO_C_PATH}
            fill="none"
            stroke={`url(#${uid}-glass)`}
            strokeWidth="17"
            strokeLinecap="round"
            opacity="0.22"
          />
          <path
            d={COSMO_C_PATH}
            fill="none"
            stroke={`url(#${uid}-glass)`}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d={COSMO_C_PATH}
            fill="none"
            stroke={`url(#${uid}-inner)`}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
            transform="translate(1,-1)"
          />
          <path
            className={
              reducedMotion
                ? "login-mark__edge-travel login-mark__edge-travel--static"
                : "login-mark__edge-travel"
            }
            d={COSMO_C_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
