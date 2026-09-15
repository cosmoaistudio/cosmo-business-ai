import { Link } from "react-router-dom";
import { Crown, ShoppingCart } from "lucide-react";

import { ProductThumbnail } from "@/features/products";
import { OsPanel } from "./os/OsPanel";
import { DashboardListSkeleton } from "./DashboardSkeleton";
import type { TopSellingProduct } from "../types/dashboard";
import {
  buildTopProductsPresentation,
  TOP_PRODUCTS_DISPLAY_LIMIT,
} from "../utils/buildTopProductsPresentation";

interface DashboardTopProductsProps {
  products: TopSellingProduct[];
  totalUnitsSold: number;
  periodLabel: string;
  loading?: boolean;
  /** Empty-state CTA for "today" period */
  showPdvCta?: boolean;
}

export default function DashboardTopProducts({
  products,
  totalUnitsSold,
  periodLabel,
  loading = false,
  showPdvCta = false,
}: DashboardTopProductsProps) {
  if (loading) {
    return (
      <OsPanel
        title={`Produtos mais vendidos · ${periodLabel}`}
        description="Ranking do período selecionado."
      >
        <DashboardListSkeleton rows={5} />
      </OsPanel>
    );
  }

  const rows = buildTopProductsPresentation(
    products,
    totalUnitsSold,
    TOP_PRODUCTS_DISPLAY_LIMIT
  );

  return (
    <OsPanel
      title={`Produtos mais vendidos · ${periodLabel}`}
      description="Líderes por quantidade no período (até 5)."
    >
      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="cosmo-os-empty" style={{ margin: 0, padding: 0 }}>
            Nenhum produto vendido neste período.
          </p>
          {showPdvCta && (
            <Link to="/pdv" className="dashboard-attention__cta">
              <ShoppingCart size={16} />
              Fazer uma venda
            </Link>
          )}
        </div>
      ) : (
        <ol className="dashboard-top-products__list">
          {rows.map((row) => {
            const barWidth =
              row.sharePercent !== null
                ? Math.max(row.sharePercent, row.totalQuantity > 0 ? 4 : 0)
                : 0;

            return (
              <li
                key={row.productId}
                className={`dashboard-top-products__item${
                  row.isLeader ? " dashboard-top-products__item--leader" : ""
                }`}
              >
                <span
                  className="dashboard-top-products__rank"
                  aria-label={`Posição ${row.rank}`}
                >
                  {row.rank}
                </span>

                <ProductThumbnail
                  product={{
                    name: row.productName,
                    image: row.image,
                  }}
                  size="sm"
                />

                <div className="dashboard-top-products__body">
                  <div className="dashboard-top-products__head">
                    <p className="dashboard-top-products__name" title={row.productName}>
                      {row.productName}
                    </p>
                    {row.isLeader && (
                      <span className="dashboard-top-products__badge">
                        <Crown size={12} aria-hidden />
                        Mais vendido
                      </span>
                    )}
                  </div>

                  <p className="dashboard-top-products__meta">
                    {row.quantityLabel}
                    <span aria-hidden> · </span>
                    {row.revenueLabel}
                    {row.shareLabel ? (
                      <>
                        <span aria-hidden> · </span>
                        {row.shareLabel} das unidades
                      </>
                    ) : null}
                  </p>

                  {row.sharePercent !== null && (
                    <div
                      className="dashboard-top-products__bar-wrap"
                      aria-hidden
                    >
                      <div
                        className="dashboard-top-products__bar"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </OsPanel>
  );
}
