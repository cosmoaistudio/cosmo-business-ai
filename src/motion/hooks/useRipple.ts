import { useCallback, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      const id = Date.now();

      setRipples((current) => [...current, { id, x, y, size }]);

      window.setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, 600);
    },
    []
  );

  return { ripples, createRipple };
}
