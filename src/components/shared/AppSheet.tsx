import {
  useEffect,
  useId,
  useRef,
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
  closeOnBackdrop = true,
  closeOnEsc = true,
  closeLabel = "Fechar",
}: AppSheetProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEsc, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

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
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col overflow-hidden ${PLACEMENT_PANEL[placement]} ${panelClassName}`}
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
            className="rounded-full p-2 opacity-70 transition hover:bg-black/5 hover:opacity-100"
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
