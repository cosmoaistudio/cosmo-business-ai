import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/components/auth-experience/hooks/usePrefersReducedMotion";

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
  speed: number;
  flicker: number;
}

interface Dust {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  depth: number;
}

function getBudget() {
  if (typeof window === "undefined") return { stars: 110, dust: 28 };
  if (window.innerWidth < 768) return { stars: 55, dust: 14 };
  return { stars: 140, dust: 36 };
}

export function LoginCosmicScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const budget = getBudget();

    const stars: Star[] = Array.from({ length: budget.stars }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.25 + Math.random() * 1.6,
      alpha: 0.12 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.025,
      flicker: 0.3 + Math.random() * 0.7,
    }));

    const dust: Dust[] = Array.from({ length: budget.dust }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.6 + Math.random() * 1.8,
      alpha: 0.04 + Math.random() * 0.1,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: -0.00004 - Math.random() * 0.00008,
      depth: 0.35 + Math.random() * 0.65,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let tick = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!ctx) return;
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      for (const d of dust) {
        d.x += d.vx * d.depth;
        d.y += d.vy * d.depth;
        if (d.y < -0.02) d.y = 1.02;
        if (d.x < -0.02) d.x = 1.02;
        if (d.x > 1.02) d.x = -0.02;

        const soft = 0.55 + Math.sin(tick * 0.01 + d.x * 8) * 0.45;
        ctx.fillStyle = `rgba(186, 210, 245, ${d.alpha * soft})`;
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.size * d.depth, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const star of stars) {
        const wave = Math.sin(tick * star.speed + star.phase);
        const twinkle =
          star.flicker > 0.75
            ? Math.max(0.08, 0.35 + wave * 0.65)
            : 0.55 + wave * 0.35;

        ctx.fillStyle = `rgba(226, 236, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
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
  }, [reducedMotion]);

  return (
    <div className="login-cosmic" aria-hidden>
      <div className="login-cosmic__base" />
      <motion.div
        className="login-cosmic__nebula login-cosmic__nebula--left"
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.72, 0.95, 0.72], scale: [1, 1.03, 1] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="login-cosmic__nebula login-cosmic__nebula--right"
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.7, 0.92, 0.7], scale: [1, 1.04, 1] }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <div className="login-cosmic__planet login-cosmic__planet--major" />
      <div className="login-cosmic__planet login-cosmic__planet--minor" />
      <motion.div
        className="login-cosmic__horizon"
        animate={
          reducedMotion ? undefined : { opacity: [0.55, 0.85, 0.55] }
        }
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="login-cosmic__rings" />
      <canvas ref={canvasRef} className="login-cosmic__stars" />
      <div className="login-cosmic__noise" />
      <div className="login-cosmic__vignette" />
    </div>
  );
}
