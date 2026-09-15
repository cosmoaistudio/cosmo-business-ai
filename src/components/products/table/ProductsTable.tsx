import { Blocks, Copy, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import {
  ProductMenuKindBadge,
  ProductStatusBadge,
  ProductThumbnail,
  resolveProductMenuKind,
  type Product,
} from "@/features/products";
import { formatCurrency } from "@/lib/format";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  searchQuery?: string;
  compositionCounts?: Record<string, number>;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onCreateSimilar?: (product: Product) => void;
}

export default function ProductsTable({
  products,
  loading,
  searchQuery = "",
  compositionCounts = {},
  selectedIds = [],
  onSelectedIdsChange,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateSimilar,
}: ProductsTableProps) {
  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  function toggleAll() {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(allSelected ? [] : products.map((p) => p.id));
  }

  function toggleOne(id: string) {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(
      selectedIds.includes(id)
        ? selectedIds.filter((entry) => entry !== id)
        : [...selectedIds, id]
    );
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <TableLoadingState label="Carregando produtos" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] shadow-sm">
        <EmptyState
          title={
            searchQuery?.trim()
              ? "Nenhum produto encontrado"
              : "Nenhum produto cadastrado"
          }
          description={
            searchQuery?.trim()
              ? "Nenhum item corresponde à busca atual. Tente outro termo."
              : "Cadastre seu primeiro produto para começar a vender no PDV."
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            {onSelectedIdsChange && (
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </th>
            )}
            <th className="px-6 py-4 text-left">Produto</th>
            <th className="text-left">Tipo</th>
            <th className="text-left">Categoria</th>
            <th className="text-left">Preço</th>
            <th className="text-left">Estoque</th>
            <th className="text-left">Status</th>
            <th className="pr-6 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b transition hover:bg-slate-50"
            >
              {onSelectedIdsChange && (
                <td className="px-4 py-5">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleOne(product.id)}
                    aria-label={`Selecionar ${product.name}`}
                  />
                </td>
              )}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <ProductThumbnail product={product} size="xs" />
                  <span className="font-semibold text-[var(--cosmo-text)]">
                    {product.name}
                  </span>
                </div>
              </td>

              <td>
                <ProductMenuKindBadge
                  kind={resolveProductMenuKind({
                    status: product.status,
                    compositionGroupCount: compositionCounts[product.id] ?? 0,
                    menuKind: product.menu_kind,
                  })}
                />
              </td>

              <td className="text-[var(--cosmo-text-muted,var(--cosmo-text-secondary))]">
                {product.category}
              </td>

              <td className="font-semibold text-[var(--cosmo-text)]">
                {formatCurrency(product.price)}
              </td>

              <td>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                  {product.stock}
                </span>
              </td>

              <td>
                <ProductStatusBadge status={product.status} />
              </td>

              <td>
                <div className="flex justify-end gap-1 pr-6">
                  <Link
                    to={`/produtos/builder/${product.id}`}
                    className="rounded-xl p-2 text-blue-600 hover:bg-blue-50"
                    aria-label={`Composição ${product.name}`}
                    title="Composição / Builder"
                  >
                    <Blocks size={18} />
                  </Link>

                  {onCreateSimilar && (
                    <button
                      type="button"
                      onClick={() => onCreateSimilar(product)}
                      className="rounded-xl p-2 text-violet-600 hover:bg-violet-50"
                      aria-label={`Criar parecido com ${product.name}`}
                      title="Criar parecido"
                    >
                      <Sparkles size={18} />
                    </button>
                  )}

                  {onDuplicate && (
                    <button
                      type="button"
                      onClick={() => onDuplicate(product)}
                      className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                      aria-label={`Duplicar ${product.name}`}
                      title="Duplicar"
                    >
                      <Copy size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="rounded-xl p-2 hover:bg-slate-100"
                    aria-label={`Editar ${product.name}`}
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(product)}
                    className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Excluir ${product.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
