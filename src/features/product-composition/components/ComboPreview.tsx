import { formatCurrency } from "@/lib/format";
import type { Product } from "@/features/products/types/product";
import type { ProductComboComponent } from "../types/combo";

export interface ComboPreviewProps {
  product: Pick<Product, "name" | "price" | "image_url" | "status">;
  components: ProductComboComponent[];
  selectionMode?: "fixed" | "choice";
  minChoices?: number | null;
  maxChoices?: number | null;
}

export default function ComboPreview({
  product,
  components,
  selectionMode = "fixed",
  minChoices,
  maxChoices,
}: ComboPreviewProps) {
  const active = components.filter((row) => row.active);
  const cups =
    selectionMode === "choice"
      ? maxChoices ?? minChoices ?? active.length
      : active.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <aside className="rounded-3xl border border-violet-200 bg-gradient-to-b from-violet-50 to-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
        Prévia do cardápio
      </p>

      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="mt-3 h-36 w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="mt-3 flex h-36 items-center justify-center rounded-2xl bg-violet-100/80 text-sm font-medium text-violet-700">
          Sem imagem
        </div>
      )}

      <h3 className="mt-4 text-xl font-bold text-slate-900">{product.name}</h3>
      <p className="mt-1 text-2xl font-semibold text-violet-700">
        {formatCurrency(Number(product.price) || 0)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Preço do combo (não soma o preço base dos produtos).
      </p>

      <div className="mt-5">
        {selectionMode === "choice" ? (
          <>
            <p className="text-sm font-semibold text-slate-800">
              Cliente escolhe {cups} copo{cups === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Entre {active.length} opções
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {active.map((row) => (
                <li key={row.id} className="flex gap-2">
                  <span className="text-violet-500">•</span>
                  <span>
                    {row.display_name?.trim() ||
                      row.component_product?.name ||
                      "Copo montado"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-800">Inclui</p>
            {active.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Adicione produtos ao combo para ver a prévia.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {active.map((row) => {
                  const label =
                    row.display_name?.trim() ||
                    row.component_product?.name ||
                    "Produto";
                  return (
                    <li key={row.id} className="flex gap-2">
                      <span className="text-violet-500">•</span>
                      <span>
                        {label}
                        {row.quantity > 1 ? ` × ${row.quantity}` : ""}
                        {row.allow_configuration ? " (personalizável)" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        disabled
        className="mt-5 w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white opacity-80"
      >
        Configurar combo
      </button>
    </aside>
  );
}
