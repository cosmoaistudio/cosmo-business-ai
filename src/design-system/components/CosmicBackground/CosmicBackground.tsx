import { useEffect, useRef } from "react";

interface CosmicBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium";
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
}

function getStarCount(intensity: "subtle" | "medium") {
  if (typeof window === "undefined") return intensity === "subtle" ? 30 : 50;
  if (window.innerWidth < 768) return intensity === "subtle" ? 20 : 35;
  return intensity === "subtle" ? 40 : 65;
}

export function CosmicBackground({
  className,
  intensity = "subtle",
}: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars: Star[] = Array.from({ length: getStarCount(intensity) }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.4 + Math.random() * 1.2,
      alpha: 0.06 + Math.random() * 0.2,
      speed: 0.00004 + Math.random() * 0.00008,
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

      for (const star of stars) {
        star.y -= star.speed;
        if (star.y < 0) star.y = 1;
        const twinkle = 0.5 + Math.sin(tick * 0.02 + star.x * 10) * 0.5;
        ctx.fillStyle = `rgba(180, 200, 255, ${star.alpha * twinkle})`;
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
  }, [intensity]);

  return (
    <div className={`cosmo-cosmic-bg ${className ?? ""}`} aria-hidden>
      <div className="cosmo-cosmic-bg__nebula" />
      <div className="cosmo-cosmic-bg__depth" />
      <canvas ref={canvasRef} className="cosmo-cosmic-bg__stars" />
      <div className="cosmo-cosmic-bg__noise" />
      <div className="cosmo-cosmic-bg__vignette" />
    </div>
  );
}
