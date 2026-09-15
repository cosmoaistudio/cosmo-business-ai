import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Intro phases (compressed for ~2s splash):
 * 0 dark → 1 particles → 2 nebula → 3 light → 4 core → 5 glow → 6 form
 */
export function useBrandIntro(options?: { compact?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const compact = options?.compact ?? false;
  const [phase, setPhase] = useState(reducedMotion ? 6 : 0);

  useEffect(() => {
    if (reducedMotion) {
      setPhase(6);
      return;
    }

    const steps = compact
      ? [
          { at: 0, p: 0 },
          { at: 120, p: 1 },
          { at: 280, p: 2 },
          { at: 420, p: 3 },
          { at: 520, p: 4 },
          { at: 700, p: 5 },
          { at: 900, p: 6 },
        ]
      : [
          { at: 0, p: 0 },
          { at: 200, p: 1 },
          { at: 450, p: 2 },
          { at: 750, p: 3 },
          { at: 1000, p: 4 },
          { at: 1350, p: 5 },
          { at: 1700, p: 6 },
        ];

    const timers = steps.map(({ at, p }) =>
      window.setTimeout(() => setPhase(p), at)
    );

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion, compact]);

  return {
    phase,
    introComplete: phase >= 6,
    coreVisible: phase >= 4,
    glowActive: phase >= 5,
    formVisible: phase >= 6,
  };
}
