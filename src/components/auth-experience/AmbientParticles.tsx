import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

interface AmbientParticlesProps {
  parallaxX?: number;
  parallaxY?: number;
  visible?: boolean;
}

interface Particle {
  x: number;
  y: number;
  depth: number;
  size: number;
  alpha: number;
  speed: number;
}

function getCount() {
  if (typeof window === "undefined") return 40;
  if (window.innerWidth < 768) return 24;
  return 55;
}

export function AmbientParticles({
  parallaxX = 0,
  parallaxY = 0,
  visible = true,
}: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const parallaxRef = useRef({ x: parallaxX, y: parallaxY });
  parallaxRef.current = { x: parallaxX, y: parallaxY };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion || !visible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = Array.from({ length: getCount() }, () => ({
      x: Math.random(),
      y: Math.random(),
      depth: 0.2 + Math.random() * 0.8,
      size: 0.4 + Math.random() * 1.2,
      alpha: 0.08 + Math.random() * 0.22,
      speed: 0.00008 + Math.random() * 0.00012,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let tick = 0;

    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!ctx) return;
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      const px = parallaxRef.current.x * 24;
      const py = parallaxRef.current.y * 24;

      for (const p of particles) {
        p.y -= p.speed * p.depth;
        if (p.y < 0) p.y = 1;

        const x = p.x * width + px * p.depth;
        const y = p.y * height + py * p.depth;
        const twinkle = 0.6 + Math.sin(tick * 0.02 + p.depth * 10) * 0.4;

        ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * p.depth, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = window.requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion, visible]);

  if (reducedMotion || !visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="cosmo-void__particles"
      aria-hidden
    />
  );
}
