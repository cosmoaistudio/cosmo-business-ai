import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { emitDataChanged } from "@/lib/sale-events";
import { productsService } from "../services/products.service";
import type { CreateProductDTO } from "../repository/products.repository";
import type { Product } from "../types/product";
import { resolveProductImage } from "../utils/productImage";
import { buildProductFormChecklist } from "../utils/productFormChecklist";
import ProductCategoryField from "./ProductCategoryField";
import ProductFormChecklist from "./ProductFormChecklist";
import ProductImageUpload from "./ProductImageUpload";
import ProductLivePreview from "./ProductLivePreview";
import "../styles/product-editor.css";

interface ProductFormProps {
  product?: Product;
  /** Used on create to persist products.menu_kind (migration 026). */
  menuKind?: Product["menu_kind"];
  /** Existing free-text categories from the org catalog (suggestions only). */
  categorySuggestions?: string[];
  /** Linked option-group names for live preview. */
  linkedAddonLabels?: string[];
  /** Short composition hint for combo/assembled preview. */
  compositionHint?: string | null;
  showCompositionChecklist?: boolean;
  hasComposition?: boolean;
  /** Receives saved product id (useful to open builder after create). */
  onSuccess?: (productId?: string) => void;
  onCancel?: () => void;
}

interface ProductFormState {
  name: string;
  category: string;
  price: string;
  stock: string;
  min_stock: string;
  description: string;
  status: string;
  image_url: string;
}

const emptyForm: ProductFormState = {
  name: "",
  category: "",
  price: "",
  stock: "",
  min_stock: "0",
  description: "",
  status: "active",
  image_url: "",
};

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    min_stock: String(product.min_stock ?? 0),
    description: product.description,
    status: product.status,
    image_url: resolveProductImage(product),
  };
}

export default function ProductForm({
  product,
  menuKind,
  categorySuggestions = [],
  linkedAddonLabels = [],
  compositionHint = null,
  showCompositionChecklist = false,
  hasComposition = false,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const { profile, session, loading: authLoading } = useAuth();
  const isEditing = Boolean(product);
  const isComboForm =
    menuKind === "combo" || product?.menu_kind === "combo";
  const draftProductId = useMemo(() => crypto.randomUUID(), []);
  const productId = product?.id ?? draftProductId;
  const organizationId = profile?.organization_id ?? "";
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(
    product ? productToForm(product) : emptyForm
  );

  useEffect(() => {
    setForm(product ? productToForm(product) : emptyForm);
  }, [product]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((old) => ({
      ...old,
      [e.target.name]: e.target.value,
    }));
  }

  function buildPayload(): CreateProductDTO {
    const imageUrl = form.image_url.trim();

    return {
      name: form.name.trim(),
      category: isComboForm
        ? form.category.trim() || "Combos"
        : form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      stock: isComboForm ? 0 : Number(form.stock) || 0,
      min_stock: isComboForm ? 0 : Number(form.min_stock) || 0,
      image_url: imageUrl || null,
      status: form.status as CreateProductDTO["status"],
      ...(menuKind ? { menu_kind: menuKind } : {}),
    };
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.warning("Informe o nome do produto.");
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload();

      let savedId = product?.id;
      if (product) {
        await productsService.update(product.id, payload);
        toast.success(
          isComboForm ? "Combo atualizado!" : "Produto atualizado com sucesso!"
        );
      } else {
        const created = await productsService.create({
          ...payload,
          id: draftProductId,
        });
        savedId = created?.id ?? draftProductId;
        toast.success(
          isComboForm
            ? "Combo criado! Agora adicione os produtos."
            : "Produto salvo com sucesso!"
        );
        // Keep form values; parent may continue editing with the new id.
      }

      onSuccess?.(savedId);
      emitDataChanged();
    } catch (error: unknown) {
      console.error("Erro ao salvar produto:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const checklist = buildProductFormChecklist({
    name: form.name,
    category: form.category,
    price: form.price,
    description: form.description,
    imageUrl: form.image_url,
    status: form.status,
    hideCategory: isComboForm,
    hasAddons: linkedAddonLabels.length > 0,
    showComposition: showCompositionChecklist,
    hasComposition,
  });

  const preview = (
    <ProductLivePreview
      name={form.name}
      category={isComboForm ? form.category || "Combos" : form.category}
      description={isComboForm ? "" : form.description}
      price={form.price}
      status={form.status}
      imageUrl={form.image_url}
      addonLabels={linkedAddonLabels}
      compositionHint={compositionHint}
      isCombo={isComboForm}
    />
  );

  return (
    <div className="product-editor-layout">
      <div className="space-y-4">
        <button
          type="button"
          className="product-editor-mobile-preview-toggle"
          onClick={() => setPreviewOpen((open) => !open)}
        >
          {previewOpen ? <EyeOff size={16} /> : <Eye size={16} />}
          {previewOpen ? "Ocultar preview" : "Ver preview do produto"}
        </button>

          <div
            className="product-editor-preview-pane max-md:block md:hidden"
            data-collapsed={previewOpen ? "false" : "true"}
          >
            {previewOpen ? preview : null}
          </div>

        <section className="product-editor-section">
          <h3 className="product-editor-section__title">
            Informações do produto
          </h3>
          <p className="product-editor-section__hint">
            Cadastre o básico agora. Foto, descrição e adicionais podem vir
            depois.
          </p>
          <div className="product-editor-section__body">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Nome
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={isComboForm ? "Nome do combo" : "Nome do produto"}
                className="cosmo-input w-full p-3"
              />
            </div>

            {!isComboForm && (
              <ProductCategoryField
                value={form.category}
                onChange={(category) =>
                  setForm((old) => ({ ...old, category }))
                }
                suggestions={categorySuggestions}
                disabled={loading}
              />
            )}

            {isComboForm ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Preço do combo
                </label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="cosmo-input w-full p-3"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Preço
                </label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0,00"
                  className="cosmo-input w-full p-3"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="cosmo-input w-full p-3"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </section>

        <details className="product-editor-section product-editor-collapse" open>
          <summary>Foto do produto</summary>
          <div className="product-editor-section__body">
            <ProductImageUpload
              productId={productId}
              organizationId={organizationId}
              imageUrl={form.image_url || undefined}
              disabled={loading || authLoading || !organizationId || !session}
              persistToDatabase={isEditing}
              onUploaded={(publicUrl) =>
                setForm((old) => ({ ...old, image_url: publicUrl }))
              }
              onRemoved={() => setForm((old) => ({ ...old, image_url: "" }))}
            />
          </div>
        </details>

        {!isComboForm && (
          <details className="product-editor-section product-editor-collapse">
            <summary>Detalhes opcionais</summary>
            <div className="product-editor-section__body">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descrição curta para o cardápio"
                  rows={3}
                  className="cosmo-input w-full p-3"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Estoque
                  </label>
                  <input
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="Estoque"
                    className="cosmo-input w-full p-3"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Estoque mínimo
                  </label>
                  <input
                    name="min_stock"
                    type="number"
                    min={0}
                    value={form.min_stock}
                    onChange={handleChange}
                    placeholder="Estoque mínimo"
                    className="cosmo-input w-full p-3"
                  />
                </div>
              </div>
            </div>
          </details>
        )}

        <ProductFormChecklist items={checklist} />

        <div className="cosmo-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cosmo-btn-cancel rounded-xl border px-5 py-3"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : isEditing
                ? isComboForm
                  ? "Atualizar combo"
                  : "Atualizar produto"
                : isComboForm
                  ? "Continuar"
                  : "Salvar produto"}
          </button>
        </div>
      </div>

      <aside className="product-editor-preview-pane hidden md:block">
        {preview}
      </aside>
    </div>
  );
}
