import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { useRegisterOverlay } from "@/components/layout/useRegisterOverlay";

type AppSheetPlacement = "center" | "right" | "bottom";

type AppSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  placement?: AppSheetPlacement;
  /** Panel surface classes (keeps consumer visual identity). */
  panelClassName?: string;
  /** Optional inline styles (e.g. MenuTheme tokens). */
  panelStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  /** Accessible label for close control. */
  closeLabel?: string;
};

const PLACEMENT_ROOT: Record<AppSheetPlacement, string> = {
  center: "items-end justify-center p-4 sm:items-center",
  right: "justify-end",
  bottom: "items-end justify-center p-0 sm:p-4",
};

const PLACEMENT_PANEL: Record<AppSheetPlacement, string> = {
  center: "max-h-[90vh] w-full max-w-2xl rounded-3xl",
  right: "h-full w-full max-w-md rounded-none",
  bottom: "max-h-[92vh] w-full max-w-lg rounded-t-3xl sm:rounded-3xl",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isFocusableCandidate(element: HTMLElement): boolean {
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(isFocusableCandidate);
}

function restoreFocus(trigger: HTMLElement | null) {
  if (trigger?.isConnected) {
    trigger.focus();
  }
}

/**
 * Shared sheet/drawer shell for overlays that are not AppModal dialogs.
 * Sticky header with X, ESC, backdrop, body scroll, optional footer.
 */
export default function AppSheet({
  open,
  title,
  onClose,
  children,
  footer,
  placement = "center",
  panelClassName = "bg-white text-slate-900 shadow-2xl",
  panelStyle,
  closeOnBackdrop = true,
  closeOnEsc = true,
  closeLabel = "Fechar",
}: AppSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const active = document.activeElement;
    triggerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    if (closeRef.current) {
      closeRef.current.focus();
    } else if (panel) {
      const focusable = getFocusableElements(panel);
      (focusable[0] ?? panel).focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!closeOnEsc) return;
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && panel.contains(current);

      if (event.shiftKey && (!inside || current === first)) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && (!inside || current === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const trigger = triggerRef.current;
      triggerRef.current = null;
      restoreFocus(trigger);
    };
  }, [open, closeOnEsc, onClose]);

  useRegisterOverlay(open);

  if (!open) return null;

  const onBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex bg-black/60 ${PLACEMENT_ROOT[placement]}`}
      onMouseDown={onBackdropMouseDown}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex flex-col overflow-hidden ${PLACEMENT_PANEL[placement]} ${panelClassName}`}
        style={panelStyle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-current/10 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="digital-focus-ring rounded-full p-2 opacity-70 transition hover:bg-current/10 hover:opacity-100"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-current/10 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
