interface MenuTemplateSwitchConfirmProps {
  open: boolean;
  templateName: string;
  onCancel: () => void;
  onContinue: () => void;
}

export default function MenuTemplateSwitchConfirm({
  open,
  templateName,
  onCancel,
  onContinue,
}: MenuTemplateSwitchConfirmProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="template-switch-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2
          id="template-switch-title"
          className="text-base font-semibold text-slate-900"
        >
          Trocar para {templateName}?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Trocar o template pode substituir algumas configurações visuais.
          Produtos, categorias e dados da loja permanecem.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
