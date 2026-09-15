import { useState } from "react";
import { toast } from "sonner";
import AppModal from "@/components/shared/AppModal";
import type { Product } from "@/features/products";
import {
  compositionAdminService,
  type CompositionCopyMode,
} from "../services/compositionAdmin.service";

interface ProductDuplicateDialogProps {
  product: Product;
  onClose: () => void;
  onDone: () => void;
}

export default function ProductDuplicateDialog({
  product,
  onClose,
  onDone,
}: ProductDuplicateDialogProps) {
  // Independent by default — never mutate the original composition graph.
  const [mode, setMode] = useState<CompositionCopyMode>("independent");
  const [name, setName] = useState(`${product.name} (cópia)`);
  const [price, setPrice] = useState(String(product.price));
  const [copyComposition, setCopyComposition] = useState(true);
  const [copyImage, setCopyImage] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    const parsedPrice = Number(price);
    if (!name.trim()) {
      toast.warning("Informe o nome da cópia.");
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast.warning("Informe um preço válido.");
      return;
    }

    try {
      setLoading(true);
      await compositionAdminService.createSimilarProduct({
        sourceProductId: product.id,
        name: name.trim(),
        price: parsedPrice,
        copyCategory: true,
        copyDescription: true,
        copyImage,
        copyComposition,
        compositionMode: mode,
      });
      toast.success("Produto duplicado com sucesso (cópia independente do fluxo).");
      onDone();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao duplicar produto."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      title="Duplicar produto"
      onClose={onClose}
      footer={
        <div className="cosmo-modal-actions">
          <button
            type="button"
            className="cosmo-btn-cancel rounded-xl border px-5 py-3"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Duplicando..." : "Duplicar"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Origem: <strong className="text-slate-900">{product.name}</strong>
        {" — "}o original nunca é alterado.
      </p>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">Nome da cópia</span>
        <input
          className="cosmo-input w-full p-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">Preço</span>
        <input
          type="number"
          min={0}
          step="0.01"
          className="cosmo-input w-full p-3"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>

      <div className="mb-4 space-y-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={copyComposition}
            onChange={(e) => setCopyComposition(e.target.checked)}
          />
          <span className="text-sm font-medium">Copiar composição (grupos/opções/regras)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={copyImage}
            onChange={(e) => setCopyImage(e.target.checked)}
          />
          <span className="text-sm font-medium">Copiar imagem</span>
        </label>
      </div>

      {copyComposition && (
        <div className="space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="radio"
              name="dup-mode"
              checked={mode === "independent"}
              onChange={() => setMode("independent")}
            />
            <span>
              <span className="block font-semibold">Cópia independente (recomendado)</span>
              <span className="mt-1 block text-sm text-slate-500">
                Duplica grupos e opções. Alterações neste produto não afetam o
                original.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="radio"
              name="dup-mode"
              checked={mode === "shared"}
              onChange={() => setMode("shared")}
            />
            <span>
              <span className="block font-semibold">Reutilizar os mesmos grupos</span>
              <span className="mt-1 block text-sm text-slate-500">
                Editar um grupo compartilhado afeta todos os produtos vinculados.
              </span>
            </span>
          </label>
        </div>
      )}
    </AppModal>
  );
}
