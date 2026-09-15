import { useEffect } from "react";
import "./styles/floating-assist.css";
import CosmoAiDrawer from "../ai/CosmoAiDrawer";
import { FeedbackButton } from "@/features/saas";
import { useCosmoAiDrawer } from "../ai/CosmoAiDrawerContext";
import { useOverlayPresence } from "./OverlayPresenceContext";
import { resolveFloatingAssistVisibility } from "./floatingAssistVisibility";

/**
 * Single safe zone for auxiliary floating actions (Cosmo AI + feedback).
 * FAB chrome is suppressed while modal/sheet overlays are open so they never
 * cover form actions. Components stay mounted so open dialogs are not torn down.
 */
export default function FloatingAssistDock() {
  const { overlayDepth } = useOverlayPresence();
  const { open: aiDrawerOpen, closeDrawer } = useCosmoAiDrawer();
  const visibility = resolveFloatingAssistVisibility({
    overlayDepth,
    aiDrawerOpen,
  });

  useEffect(() => {
    if (overlayDepth > 0 && aiDrawerOpen) {
      closeDrawer();
    }
  }, [overlayDepth, aiDrawerOpen, closeDrawer]);

  const suppressChrome = !visibility.showDock;

  return (
    <div
      className={
        suppressChrome
          ? "cosmo-floating-assist cosmo-floating-assist--suppressed"
          : "cosmo-floating-assist"
      }
      data-compact={visibility.compact ? "true" : "false"}
      data-feedback={visibility.showFeedback ? "visible" : "hidden"}
      aria-label="Assistência Cosmo"
    >
      <CosmoAiDrawer docked />
      <FeedbackButton docked />
    </div>
  );
}
