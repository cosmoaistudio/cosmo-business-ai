import { formatCurrency } from "@/lib/format";
import { ProductThumbnail } from "@/features/products";
import type { TopSellingProduct } from "../types/dashboard";
import { DashboardListSkeleton } from "./DashboardSkeleton";

interface TopProductsChartProps {
  products: TopSellingProduct[];
  loading?: boolean;
  /** When true, skips outer card chrome (used inside OsPanel) */
  embedded?: boolean;
}

export default function TopProductsChart({
  products,
  loading = false,
  embedded = false,
}: TopProductsChartProps) {
  const maxQuantity = Math.max(
    ...products.map((product) => product.totalQuantity),
    1
  );

  if (loading) {
    return <DashboardListSkeleton rows={5} />;
  }

  const body = (
    <>
      {products.length === 0 && (
        <div className="cosmo-os-empty">Nenhuma venda registrada ainda.</div>
      )}

      {products.length > 0 && (
        <div className="space-y-4">
          {products.map((product, index) => {
            const widthPercent = (product.totalQuantity / maxQuantity) * 100;

            return (
              <div key={product.productId}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductThumbnail
                      product={{
                        name: product.productName,
                        image: product.image,
                      }}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {index + 1}. {product.productName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(product.totalRevenue)} em receita
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">
                    {product.totalQuantity} un.
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                    style={{ width: `${Math.max(widthPercent, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return <div className="cosmo-os-panel p-5 sm:p-6">{body}</div>;
}
