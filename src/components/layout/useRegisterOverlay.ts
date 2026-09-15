import { useEffect } from "react";
import { useOptionalOverlayPresence } from "./OverlayPresenceContext";

/**
 * Registers an open overlay (modal/sheet) so floating assists can hide.
 * Mount while the overlay is visible.
 */
export function useRegisterOverlay(active = true) {
  const presence = useOptionalOverlayPresence();

  useEffect(() => {
    if (!active || !presence) return;
    presence.beginOverlay();
    return () => presence.endOverlay();
  }, [active, presence]);
}
