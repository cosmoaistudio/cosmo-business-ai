import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MotionContext } from "./motionContext";

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value = useMemo(() => ({ reducedMotion }), [reducedMotion]);

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}
