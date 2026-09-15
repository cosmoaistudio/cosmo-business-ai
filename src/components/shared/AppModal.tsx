import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { useRegisterOverlay } from "@/components/layout/useRegisterOverlay";

type AppModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional sticky footer (actions). Prefer this over burying buttons in long forms. */
  footer?: ReactNode;
  size?: "md" | "lg" | "xl" | "2xl";
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
};

const SIZE_CLASS: Record<NonNullable<AppModalProps["size"]>, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

/**
 * Official Cosmo modal shell.
 * Fixed header (title + X always visible), scrollable body, optional sticky footer.
 * ESC + backdrop close by default.
 */
export default function AppModal({
  title,
  onClose,
  children,
  footer,
  size = "lg",
  closeOnBackdrop = true,
  closeOnEsc = true,
}: AppModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useRegisterOverlay(true);

  useEffect(() => {
    if (!closeOnEsc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOnEsc, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="cosmo-modal-root fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onBackdropMouseDown}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`cosmo-modal flex w-full ${SIZE_CLASS[size]} max-h-[min(90vh,880px)] flex-col overflow-hidden rounded-3xl shadow-2xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cosmo-modal__header flex shrink-0 items-center justify-between gap-3 border-b px-6 py-4">
          <h2
            id={titleId}
            className="cosmo-modal__title text-xl font-bold tracking-tight sm:text-2xl"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="cosmo-modal__close rounded-xl p-2"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </header>

        <div className="cosmo-modal__body min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer ? (
          <footer className="cosmo-modal__footer shrink-0 border-t px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
