import { ProductImageUpload } from "@/features/products";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Input } from "@/components/ui/input";
import type { Product } from "@/features/products/types/product";
import type { BuilderProductForm, BuilderSize } from "../types/builder";
import ProductSizeEditor from "./ProductSizeEditor";

interface ProductEditorPanelProps {
  product: Product;
  productForm: BuilderProductForm;
  sizes: BuilderSize[];
  productErrors?: string[];
  onProductChange: (patch: Partial<BuilderProductForm>) => void;
  onAddSize: () => void;
  onUpdateSize: (sizeId: string, patch: Partial<BuilderSize>) => void;
  onRemoveSize: (sizeId: string) => void;
  onReorderSizes: (from: number, to: number) => void;
}

export default function ProductEditorPanel({
  product,
  productForm,
  sizes,
  productErrors = [],
  onProductChange,
  onAddSize,
  onUpdateSize,
  onRemoveSize,
  onReorderSizes,
}: ProductEditorPanelProps) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
          Editor de Produto
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Informações base
        </h2>

        {productErrors.length > 0 && (
          <div className="mt-4 space-y-1 rounded-2xl bg-red-50 px-4 py-3">
            {productErrors.map((error) => (
              <p key={error} className="text-sm text-red-700">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[160px_1fr]">
          <ProductImageUpload
            productId={product.id}
            organizationId={organizationId}
            imageUrl={productForm.image_url || ""}
            persistToDatabase
            onUploaded={(url) => onProductChange({ image_url: url })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Nome
              </label>
              <Input
                value={productForm.name}
                onChange={(event) =>
                  onProductChange({ name: event.target.value })
                }
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Categoria
              </label>
              <Input
                value={productForm.category}
                onChange={(event) =>
                  onProductChange({ category: event.target.value })
                }
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                SKU
              </label>
              <Input
                value={productForm.sku}
                onChange={(event) =>
                  onProductChange({ sku: event.target.value })
                }
                placeholder="Identificador interno"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Preço base
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={productForm.price}
                disabled={sizes.length > 0}
                onChange={(event) =>
                  onProductChange({ price: event.target.value })
                }
                className="rounded-xl"
              />
              {sizes.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Preço definido pelos tamanhos.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Status
              </label>
              <select
                value={productForm.status}
                onChange={(event) =>
                  onProductChange({ status: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Pausado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Descrição
              </label>
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  onProductChange({ description: event.target.value })
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <ProductSizeEditor
        sizes={sizes}
        onAdd={onAddSize}
        onUpdate={onUpdateSize}
        onRemove={onRemoveSize}
        onReorder={onReorderSizes}
      />
    </div>
  );
}
