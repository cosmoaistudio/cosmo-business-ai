interface MenuRestoreActionsProps {
  onResetSection: () => void;
  onRestoreSaved?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export default function MenuRestoreActions({
  onResetSection,
  onRestoreSaved,
  onUndo,
  canUndo = false,
}: MenuRestoreActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {onUndo ? (
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 underline-offset-2 hover:underline disabled:opacity-40"
        >
          Cancelar alteração atual
        </button>
      ) : null}
      {onRestoreSaved ? (
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Descartar alterações desta seção e voltar ao que está salvo na loja?"
              )
            ) {
              onRestoreSaved();
            }
          }}
          className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 underline-offset-2 hover:underline"
        >
          Descartar alterações
        </button>
      ) : null}
      <button
        type="button"
        onClick={onResetSection}
        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 underline-offset-2 hover:underline"
      >
        Restaurar seção
      </button>
    </div>
  );
}
