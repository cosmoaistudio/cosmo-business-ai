import { Blocks, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { ProductStatusBadge, ProductThumbnail, useProducts } from "@/features/products";

export default function ProductBuilderListPage() {
  const { products, loading } = useProducts();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Product Builder"
        subtitle="Monte produtos personalizáveis com editor, construtor visual e preview em tempo real — powered by Product Engine."
      />

      {loading ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <TableLoadingState label="Carregando produtos" rows={4} />
        </div>
      ) : products.length === 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={Blocks}
            title="Nenhum produto cadastrado"
            description="Cadastre um produto em Produtos para abrir no Builder Visual."
            action={
              <Link to="/produtos">
                <Button type="button" className="rounded-xl">
                  Ir para Produtos
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/produtos/builder/${product.id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <ProductThumbnail product={product} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-blue-700">
                        {product.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {product.category || "Sem categoria"}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300 group-hover:text-blue-500"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ProductStatusBadge status={product.status} />
                    <span className="text-sm font-semibold text-slate-700">
                      {formatCurrency(Number(product.price))}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
