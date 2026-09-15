import { useEffect, useRef, useState } from "react";

import { COSMO_C_PATH, COSMO_VIEWBOX, samplePathPoints, type PathPoint } from "./cosmoMarkPath";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

interface CosmoNebulaFieldProps {
  intensity?: number;
  hoverBoost?: number;
  particleScale?: number;
  className?: string;
}

interface DriftCloud {
  pathIndex: number;
  offset: number;
  spread: number;
  alpha: number;
  speed: number;
  phase: number;
}

function getBudget() {
  if (typeof window === "undefined") return { clouds: 18, wisps: 14 };
  if (window.innerWidth < 768) return { clouds: 12, wisps: 8 };
  return { clouds: 28, wisps: 18 };
}

export function CosmoNebulaField({
  intensity = 0.45,
  hoverBoost = 0,
  particleScale = 1,
  className,
}: CosmoNebulaFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const intensityRef = useRef(intensity);
  const hoverRef = useRef(hoverBoost);
  const scaleRef = useRef(particleScale);
  const [pathPoints, setPathPoints] = useState<PathPoint[]>([]);

  intensityRef.current = intensity;
  hoverRef.current = hoverBoost;
  scaleRef.current = particleScale;

  useEffect(() => {
    setPathPoints(samplePathPoints(COSMO_C_PATH, 36));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion || pathPoints.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const budget = getBudget();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let tick = 0;

    const clouds: DriftCloud[] = Array.from({ length: budget.clouds }, (_, i) => ({
      pathIndex: i % pathPoints.length,
      offset: (Math.random() - 0.5) * 18,
      spread: 14 + (i % 4) * 8,
      alpha: 0.04 + (i % 5) * 0.012,
      speed: 0.0004 + (i % 3) * 0.00015,
      phase: Math.random() * Math.PI * 2,
    }));

    const wisps = Array.from({ length: budget.wisps }, (_, i) => ({
      pathIndex: Math.floor((i / budget.wisps) * pathPoints.length),
      angle: (i / budget.wisps) * Math.PI * 2,
      orbit: 0.08 + (i % 4) * 0.03,
      speed: 0.0008 + (i % 3) * 0.0002,
      size: 0.6 + (i % 3) * 0.5,
      alpha: 0.15 + (i % 4) * 0.1,
    }));

    function resize() {
      const parent = canvas?.parentElement;
      if (!canvas || !ctx || !parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!ctx || width === 0) return;

      tick += 1;
      const scale = width / COSMO_VIEWBOX;
      const cx = width / 2;
      const cy = height / 2;
      const energy = intensityRef.current + hoverRef.current * 0.6;
      const pScale = scaleRef.current;
      const breathe = 1 + Math.sin(tick * 0.011) * 0.07;

      ctx.clearRect(0, 0, width, height);

      for (const cloud of clouds) {
        cloud.phase += cloud.speed * (1 + energy * 2.2) * breathe;
        const anchor = pathPoints[cloud.pathIndex];
        const wobble = Math.sin(cloud.phase) * cloud.offset;
        const nx = anchor.x + wobble * 0.6;
        const ny = anchor.y + Math.cos(cloud.phase * 1.3) * cloud.offset * 0.5;
        const px = cx + (nx - COSMO_VIEWBOX / 2) * scale;
        const py = cy + (ny - COSMO_VIEWBOX / 2) * scale;
        const size = (cloud.spread + 16) * scale * pScale * (1 + energy * 0.45);

        const grad = ctx.createRadialGradient(px, py, 0, px, py, size);
        grad.addColorStop(
          0,
          `rgba(180, 210, 255, ${cloud.alpha * (0.75 + energy * 0.85)})`
        );
        grad.addColorStop(
          0.45,
          `rgba(91, 157, 255, ${cloud.alpha * (0.5 + energy * 0.55)})`
        );
        grad.addColorStop(1, "rgba(37, 99, 235, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const wisp of wisps) {
        wisp.angle += wisp.speed * (1 + energy * 2.8);
        const anchor = pathPoints[wisp.pathIndex];
        const r = wisp.orbit * width * breathe;
        const px =
          cx +
          (anchor.x - COSMO_VIEWBOX / 2) * scale +
          Math.cos(wisp.angle) * r;
        const py =
          cy +
          (anchor.y - COSMO_VIEWBOX / 2) * scale +
          Math.sin(wisp.angle) * r * 0.92;
        const twinkle = 0.5 + Math.sin(tick * 0.038 + wisp.angle * 2) * 0.5;

        ctx.fillStyle = `rgba(230, 240, 255, ${wisp.alpha * twinkle * (0.4 + energy * 0.6)})`;
        ctx.beginPath();
        ctx.arc(px, py, wisp.size * scale * pScale, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = window.requestAnimationFrame(draw);
    }

    resize();
    draw();

    const parentEl = canvas.parentElement;
    const observer = parentEl ? new ResizeObserver(resize) : null;
    observer?.observe(parentEl!);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [pathPoints, reducedMotion]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

/** @deprecated */
export const EnergyFieldCanvas = CosmoNebulaField;
