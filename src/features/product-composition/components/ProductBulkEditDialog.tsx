import { useState } from "react";
import { toast } from "sonner";
import AppModal from "@/components/shared/AppModal";
import type { Product } from "@/features/products";
import { compositionAdminService } from "../services/compositionAdmin.service";

type BulkAction =
  | "price"
  | "pause"
  | "activate"
  | "category"
  | "applyComposition"
  | "clearComposition";

interface ProductBulkEditDialogProps {
  products: Product[];
  selectedIds: string[];
  onClose: () => void;
  onDone: () => void;
}

export default function ProductBulkEditDialog({
  products,
  selectedIds,
  onClose,
  onDone,
}: ProductBulkEditDialogProps) {
  const [action, setAction] = useState<BulkAction>("pause");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [sourceId, setSourceId] = useState(selectedIds[0] ?? "");
  const [loading, setLoading] = useState(false);

  const selected = products.filter((p) => selectedIds.includes(p.id));

  async function handleApply() {
    try {
      setLoading(true);

      switch (action) {
        case "pause":
          await compositionAdminService.bulkUpdateProducts(selectedIds, {
            status: "inactive",
          });
          break;
        case "activate":
          await compositionAdminService.bulkUpdateProducts(selectedIds, {
            status: "active",
          });
          break;
        case "price": {
          const value = Number(price);
          if (Number.isNaN(value) || value < 0) {
            throw new Error("Informe um preço válido.");
          }
          await compositionAdminService.bulkUpdateProducts(selectedIds, {
            price: value,
          });
          break;
        }
        case "category":
          if (!category.trim()) throw new Error("Informe a categoria.");
          await compositionAdminService.bulkUpdateProducts(selectedIds, {
            category: category.trim(),
          });
          break;
        case "applyComposition":
          if (!sourceId) throw new Error("Selecione o produto modelo.");
          await compositionAdminService.applyCompositionToProducts(
            sourceId,
            selectedIds
          );
          break;
        case "clearComposition":
          await compositionAdminService.clearComposition(selectedIds);
          break;
      }

      toast.success(`Ação aplicada em ${selectedIds.length} produto(s).`);
      onDone();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha na edição em massa."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal
      title="Edição em massa"
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
            onClick={handleApply}
            disabled={loading || selectedIds.length === 0}
          >
            {loading ? "Aplicando..." : "Aplicar"}
          </button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        {selected.length} produto(s) selecionado(s)
      </p>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium">Ação</span>
        <select
          className="cosmo-input w-full p-3"
          value={action}
          onChange={(e) => setAction(e.target.value as BulkAction)}
        >
          <option value="pause">Pausar</option>
          <option value="activate">Ativar</option>
          <option value="price">Alterar preço</option>
          <option value="category">Alterar categoria</option>
          <option value="applyComposition">Aplicar composição de modelo</option>
          <option value="clearComposition">Remover composição</option>
        </select>
      </label>

      {action === "price" && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Novo preço</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className="cosmo-input w-full p-3"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
      )}

      {action === "category" && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Categoria</span>
          <input
            className="cosmo-input w-full p-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
      )}

      {action === "applyComposition" && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Produto modelo (composição compartilhada)
          </span>
          <select
            className="cosmo-input w-full p-3"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">
            Os grupos do modelo serão vinculados (reutilizados) nos produtos
            selecionados. Não cria cópia independente.
          </p>
        </label>
      )}
    </AppModal>
  );
}
