import { useEffect, useId, useRef } from "react";

interface MenuUnsavedChangesProps {
  open: boolean;
  onContinue: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

/**
 * Guard dialog — never lose customizations silently.
 */
export default function MenuUnsavedChanges({
  open,
  onContinue,
  onDiscard,
  onSave,
}: MenuUnsavedChangesProps) {
  const titleId = useId();
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"
      role="presentation"
      onClick={onContinue}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          Alterações não salvas
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Você tem personalizações que ainda não foram salvas. O que deseja
          fazer?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            ref={firstRef}
            type="button"
            onClick={onContinue}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Continuar editando
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
