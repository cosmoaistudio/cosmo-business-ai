import { useState } from "react";
import { toast } from "sonner";
import AppModal from "@/components/shared/AppModal";
import type { Product } from "@/features/products";
import {
  compositionAdminService,
  type CompositionCopyMode,
} from "../services/compositionAdmin.service";

interface ProductSimilarDialogProps {
  product: Product;
  onClose: () => void;
  onDone: () => void;
}

export default function ProductSimilarDialog({
  product,
  onClose,
  onDone,
}: ProductSimilarDialogProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(String(product.price));
  const [copyCategory, setCopyCategory] = useState(true);
  const [copyImage, setCopyImage] = useState(true);
  const [copyDescription, setCopyDescription] = useState(true);
  const [copyComposition, setCopyComposition] = useState(true);
  const [compositionMode, setCompositionMode] =
    useState<CompositionCopyMode>("independent");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    try {
      setLoading(true);
      await compositionAdminService.createSimilarProduct({
        sourceProductId: product.id,
        name,
        price: Number(price) || 0,
        copyCategory,
        copyImage,
        copyDescription,
        copyComposition,
        compositionMode,
      });
      toast.success("Produto criado com sucesso.");
      onDone();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao criar produto."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      title="Criar parecido"
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
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar produto"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Base: <strong className="text-slate-900">{product.name}</strong>
      </p>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Nome</span>
          <input
            className="cosmo-input w-full p-3"
            placeholder="Ex: Açaí 700ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Preço (R$)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className="cosmo-input w-full p-3"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
      </div>

      <p className="mb-2 text-sm font-semibold">Copiar</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {(
          [
            ["Categoria", copyCategory, setCopyCategory],
            ["Imagem", copyImage, setCopyImage],
            ["Descrição", copyDescription, setCopyDescription],
            ["Composição", copyComposition, setCopyComposition],
          ] as const
        ).map(([label, checked, setChecked]) => (
          <label
            key={label}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      {copyComposition && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Como copiar a composição</p>
          <label className="flex gap-2 text-sm">
            <input
              type="radio"
              checked={compositionMode === "shared"}
              onChange={() => setCompositionMode("shared")}
            />
            Mesma composição (reutilizar grupos)
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="radio"
              checked={compositionMode === "independent"}
              onChange={() => setCompositionMode("independent")}
            />
            Cópia independente
          </label>
        </div>
      )}
    </AppModal>
  );
}
