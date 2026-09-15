import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { COSMO_C_PATH } from "./cosmoMarkPath";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

const EASE = [0.45, 0, 0.55, 1] as const;

export interface CosmoCoreProps {
  size?: number;
  interactive?: boolean;
  className?: string;
  introComplete?: boolean;
}

/**
 * Cosmo brand C — SVG strokes only.
 * No <canvas>, no feGaussianBlur, no CSS filter:drop-shadow.
 * Those composite as a visible rectangle around the mark in Chromium/Electron.
 */
export function CosmoCore({
  size = 118,
  interactive = true,
  className,
  introComplete = true,
}: CosmoCoreProps) {
  const uid = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [proximity, setProximity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, rotate: 0 });

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!interactive || reducedMotion || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const distance = Math.hypot(dx, dy);
      const maxDistance = Math.max(size * 3.2, 240);
      const nextProximity = Math.max(0, 1 - distance / maxDistance);

      const inside =
        distance < size * 0.55 &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      setProximity(nextProximity);
      setIsHovered(inside);
      setTilt({
        x: (dx / maxDistance) * 8 * nextProximity,
        y: (dy / maxDistance) * 8 * nextProximity,
        rotate: (dx / maxDistance) * 2.5 * nextProximity,
      });
    },
    [interactive, reducedMotion, size]
  );

  const handlePointerLeave = useCallback(() => {
    setProximity(0);
    setIsHovered(false);
    setTilt({ x: 0, y: 0, rotate: 0 });
  }, []);

  const handlePointerEnter = useCallback(() => {
    if (!interactive || reducedMotion) return;
    setPulse(true);
    window.setTimeout(() => setPulse(false), 720);
  }, [interactive, reducedMotion]);

  const scale = reducedMotion
    ? 1
    : 1 + proximity * 0.03 + (isHovered ? 0.02 : 0);
  const energy = 0.32 + proximity * 0.48 + (isHovered ? 0.38 : 0);
  const useMotionTilt = interactive && !reducedMotion;

  const stageClass = "cosmo-singularity__stage";
  const stageStyle = {
    "--singularity-energy": energy,
  } as CSSProperties;

  const sculpture = (
    <>
      <div className="cosmo-singularity__aura cosmo-singularity__aura--deep" />
      <div className="cosmo-singularity__aura cosmo-singularity__aura--mid" />

      <svg
        className="cosmo-singularity__sculpture"
        viewBox="0 0 144 144"
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${uid}-glass`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(244, 247, 255, 0.95)" />
            <stop offset="45%" stopColor="rgba(200, 220, 255, 0.75)" />
            <stop offset="100%" stopColor="rgba(130, 175, 240, 0.55)" />
          </linearGradient>
          <linearGradient
            id={`${uid}-inner`}
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {/* Soft volume via stacked strokes — replaces feGaussianBlur + drop-shadow */}
        <path
          className="cosmo-singularity__glass-shadow"
          d={COSMO_C_PATH}
          fill="none"
          stroke={`url(#${uid}-glass)`}
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.18"
        />
        <path
          className="cosmo-singularity__glass-shadow"
          d={COSMO_C_PATH}
          fill="none"
          stroke={`url(#${uid}-glass)`}
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.28"
          transform="translate(1.5, 2)"
        />

        <path
          className="cosmo-singularity__glass-body"
          d={COSMO_C_PATH}
          fill="none"
          stroke={`url(#${uid}-glass)`}
          strokeWidth="11"
          strokeLinecap="round"
        />

        <path
          className="cosmo-singularity__glass-inner"
          d={COSMO_C_PATH}
          fill="none"
          stroke={`url(#${uid}-inner)`}
          strokeWidth="4"
          strokeLinecap="round"
          transform="translate(1.5, -1)"
          opacity="0.7"
        />

        <path
          className="cosmo-singularity__edge-travel"
          d={COSMO_C_PATH}
          fill="none"
          stroke="rgba(255, 255, 255, 0.92)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div className="cosmo-singularity__aura cosmo-singularity__aura--front" />
    </>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "cosmo-singularity",
        introComplete && "cosmo-singularity--alive",
        isHovered && "cosmo-singularity--hovered",
        pulse && "cosmo-singularity--pulse",
        className
      )}
      style={
        {
          "--singularity-size": `${size}px`,
          "--singularity-energy": energy,
        } as CSSProperties
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      role="img"
      aria-label="Cosmo"
    >
      {useMotionTilt ? (
        <motion.div
          className={stageClass}
          style={stageStyle}
          animate={{
            scale,
            x: tilt.x,
            y: tilt.y,
            rotateZ: tilt.rotate,
          }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          {sculpture}
        </motion.div>
      ) : (
        <div className={stageClass} style={stageStyle}>
          {sculpture}
        </div>
      )}
    </div>
  );
}

export const CosmoMark = CosmoCore;
