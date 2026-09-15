import { useCallback, useState, type PointerEvent } from "react";

import { AmbientParticles } from "./AmbientParticles";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

interface CosmoVoidProps {
  introPhase?: number;
}

export function CosmoVoid({ introPhase = 6 }: CosmoVoidProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      setParallax({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      });
    },
    [reducedMotion]
  );

  const showParticles = reducedMotion ? true : introPhase >= 1;
  const showNebula = reducedMotion ? true : introPhase >= 2;
  const showLight = reducedMotion ? true : introPhase >= 3;

  return (
    <div className="cosmo-void" onPointerMove={handlePointerMove} aria-hidden>
      <div className="cosmo-void__abyss" />
      <div
        className="cosmo-void__depth"
        style={{
          transform: `translate(${parallax.x * -10}px, ${parallax.y * -8}px)`,
        }}
      />
      <div
        className={`cosmo-void__mist ${showNebula ? "cosmo-void__mist--on" : ""}`}
        style={{
          transform: `translate(${parallax.x * -18}px, ${parallax.y * -12}px)`,
        }}
      />
      <div
        className={`cosmo-void__shaft ${showLight ? "cosmo-void__shaft--on" : ""}`}
      />
      <div className="cosmo-void__noise" />
      <AmbientParticles
        parallaxX={parallax.x}
        parallaxY={parallax.y}
        visible={showParticles}
      />
      <div className="cosmo-void__vignette" />
    </div>
  );
}

/** @deprecated */
export const BrandUniverse = CosmoVoid;
