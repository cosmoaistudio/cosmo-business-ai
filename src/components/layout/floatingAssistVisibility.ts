/**
 * Deterministic rules for floating assist visibility (Cosmo AI + Feedback).
 * Auxiliary FABs never compete with modal/sheet primary actions.
 */

export interface FloatingAssistVisibilityInput {
  overlayDepth: number;
  aiDrawerOpen: boolean;
}

export interface FloatingAssistVisibility {
  /** Entire dock (both assists) */
  showDock: boolean;
  /** Feedback / suggestion buttons */
  showFeedback: boolean;
  /** Cosmo AI FAB (also used to close when drawer open) */
  showCosmoFab: boolean;
  /** Prefer compact icon controls */
  compact: boolean;
}

export function resolveFloatingAssistVisibility(
  input: FloatingAssistVisibilityInput
): FloatingAssistVisibility {
  const overlayBlocked = input.overlayDepth > 0;

  if (overlayBlocked) {
    return {
      showDock: false,
      showFeedback: false,
      showCosmoFab: false,
      compact: true,
    };
  }

  return {
    showDock: true,
    // While AI drawer is open, keep only Cosmo control (close) — hide suggestion FABs
    showFeedback: !input.aiDrawerOpen,
    showCosmoFab: true,
    compact: true,
  };
}
