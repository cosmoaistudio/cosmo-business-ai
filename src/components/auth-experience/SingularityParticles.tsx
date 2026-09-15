import { useEffect, useRef } from "react";

import { COSMO_C_PATH, samplePathPoints } from "./cosmoMarkPath";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

interface SingularityParticlesProps {
  layer: "back" | "front";
  energy?: number;
  className?: string;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

function getCount(layer: "back" | "front") {
  if (typeof window === "undefined") return layer === "back" ? 14 : 10;
  if (window.innerWidth < 768) return layer === "back" ? 10 : 7;
  return layer === "back" ? 22 : 14;
}

export function SingularityParticles({
  layer,
  energy = 0.4,
  className,
}: SingularityParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const energyRef = useRef(energy);
  energyRef.current = energy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pathPoints = samplePathPoints(COSMO_C_PATH, 28);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let tick = 0;

    const sparks: Spark[] = Array.from({ length: getCount(layer) }, (_, i) => {
      const anchor = pathPoints[i % pathPoints.length];
      const spread = layer === "back" ? 28 : 14;
      return {
        x: anchor.x + (Math.random() - 0.5) * spread,
        y: anchor.y + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 0.08,
        vy: layer === "back" ? 0.02 + Math.random() * 0.04 : -0.02 - Math.random() * 0.03,
        size: layer === "back" ? 0.5 + Math.random() * 0.9 : 0.7 + Math.random() * 1.1,
        alpha: layer === "back" ? 0.12 + Math.random() * 0.18 : 0.2 + Math.random() * 0.28,
        life: Math.random(),
      };
    });

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
      const scale = width / 144;
      const cx = width / 2;
      const cy = height / 2;
      const e = energyRef.current;
      const breathe = 1 + Math.sin(tick * 0.012) * 0.04;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < sparks.length; i += 1) {
        const spark = sparks[i];
        const anchor = pathPoints[i % pathPoints.length];

        spark.x += spark.vx * (1 + e * 0.8);
        spark.y += spark.vy * breathe * (1 + e * 0.5);
        spark.life += 0.004;

        const drift =
          Math.sin(tick * 0.018 + spark.life * 6) * (layer === "back" ? 6 : 3);
        const px = cx + (spark.x - 72) * scale + drift;
        const py = cy + (spark.y - 72) * scale;

        const dist = Math.hypot(spark.x - anchor.x, spark.y - anchor.y);
        const maxDist = layer === "back" ? 38 : 22;
        if (dist > maxDist) {
          spark.x = anchor.x + (Math.random() - 0.5) * (maxDist * 0.4);
          spark.y = anchor.y + (Math.random() - 0.5) * (maxDist * 0.4);
        }

        const twinkle = 0.45 + Math.sin(tick * 0.04 + spark.life * 8) * 0.55;
        const alpha =
          spark.alpha * twinkle * (layer === "back" ? 0.55 + e * 0.35 : 0.65 + e * 0.45);

        ctx.fillStyle =
          layer === "back"
            ? `rgba(120, 150, 190, ${alpha})`
            : `rgba(220, 234, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, spark.size * scale * (layer === "front" ? 1.1 : 0.85), 0, Math.PI * 2);
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
  }, [layer, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      data-layer={layer}
    />
  );
}
