import AppModal from "@/components/shared/AppModal";
import { productMenuKindEmoji } from "../utils/productMenuKind";

export type CreateProductIntent = "simple" | "assembled" | "combo";

interface ProductCreateTypeDialogProps {
  onClose: () => void;
  onChoose: (intent: CreateProductIntent) => void;
}

export default function ProductCreateTypeDialog({
  onClose,
  onChoose,
}: ProductCreateTypeDialogProps) {
  return (
    <AppModal title="Criar produto" onClose={onClose}>
      <p className="mb-5 text-sm text-slate-500">
        Escolha o tipo de produto para o cardápio.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onChoose("simple")}
          className="flex w-full flex-col rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40"
        >
          <span className="text-base font-semibold text-slate-900">
            {productMenuKindEmoji("simple")} Produto simples
          </span>
          <span className="mt-1 text-sm text-slate-500">
            Item direto no cardápio, sem montagem.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("assembled")}
          className="flex w-full flex-col rounded-2xl border border-slate-200 p-4 text-left transition hover:border-sky-400 hover:bg-sky-50/40"
        >
          <span className="text-base font-semibold text-slate-900">
            {productMenuKindEmoji("assembled")} Copo montado
          </span>
          <span className="mt-1 text-sm text-slate-500">
            Preço base + grupos de complementos e adicionais.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("combo")}
          className="flex w-full flex-col rounded-2xl border border-violet-200 bg-violet-50/30 p-4 text-left transition hover:border-violet-400 hover:bg-violet-50/60"
        >
          <span className="text-base font-semibold text-slate-900">
            {productMenuKindEmoji("combo")} Combo
          </span>
          <span className="mt-1 text-sm text-slate-500">
            Preço do combo + produtos que o cliente pode personalizar.
          </span>
        </button>
      </div>
    </AppModal>
  );
}
