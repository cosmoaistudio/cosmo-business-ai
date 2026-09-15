import type { Product } from "@/features/products";
import { ProductSearch, ProductStatusBadge } from "@/features/products";
import { formatCurrency } from "@/lib/format";
import Card from "@/components/shared/Card";
import ProductThumbnail from "./ProductThumbnail";

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  loading?: boolean;
  onSearchChange: (value: string) => void;
  onAddProduct: (product: Product) => void;
}

export default function ProductGrid({
  products,
  searchQuery,
  loading = false,
  onSearchChange,
  onAddProduct,
}: ProductGridProps) {
  return (
    <div className="space-y-6">
      <ProductSearch value={searchQuery} onChange={onSearchChange} />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-base font-semibold text-slate-800">
            {searchQuery.trim()
              ? "Nenhum produto encontrado"
              : "Nenhum produto cadastrado"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery.trim()
              ? "Ajuste a busca ou limpe o filtro para ver o catálogo."
              : "Cadastre produtos no menu Catálogo para começar a vender."}
          </p>
        </Card>
      )}

      {!loading && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onAddProduct(product)}
              className="text-left transition hover:-translate-y-0.5"
            >
              <Card className="h-full overflow-hidden p-0 transition hover:border-blue-200 hover:shadow-lg">
                <div className="flex items-stretch gap-0">
                  <div className="flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                    <ProductThumbnail product={product} size="pdv" />
                  </div>

                  <div className="min-w-0 flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 font-semibold text-slate-900">
                        {product.name}
                      </h3>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {product.stock} un.
                      </span>
                    </div>

                    {product.category && (
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {product.category}
                      </p>
                    )}

                    <ProductStatusBadge
                      status={product.status}
                      className="mt-2 inline-block px-2.5 py-1 text-xs"
                    />

                    <p className="mt-3 text-xl font-bold text-blue-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
