import { AlertTriangle, Layers, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats } from "../types/dashboard";

interface DashboardInsightsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export default function DashboardInsights({
  stats,
  loading = false,
}: DashboardInsightsProps) {
  const topProduct = stats.topSellingProducts[0];
  const topOption = stats.topSellingOptions[0];
  const topCustomer = stats.topCustomers[0];
  const topAlert = stats.stockAlerts[0];

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-8 text-white shadow-2xl">
      <div>
        <h2 className="text-2xl font-bold">Insights do negócio</h2>
        <p className="mt-1 text-blue-200">
          Dados em tempo real do Supabase
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-400" />
            <h3 className="font-semibold">Destaque de vendas</h3>
          </div>

          {loading && (
            <p className="mt-3 text-blue-100">Carregando...</p>
          )}

          {!loading && !topProduct && (
            <p className="mt-3 text-blue-100">
              Ainda não há vendas registradas para gerar insights.
            </p>
          )}

          {!loading && topProduct && (
            <p className="mt-3 text-blue-100">
              <strong>{topProduct.productName}</strong> lidera as vendas com{" "}
              {topProduct.totalQuantity} unidade
              {topProduct.totalQuantity === 1 ? "" : "s"} e{" "}
              {formatCurrency(topProduct.totalRevenue)} em faturamento.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-300" />
            <h3 className="font-semibold">Alertas de estoque</h3>
          </div>

          {loading && (
            <p className="mt-3 text-blue-100">Carregando alertas...</p>
          )}

          {!loading && stats.stockAlerts.length === 0 && (
            <p className="mt-3 text-blue-100">
              Nenhum produto com estoque abaixo do mínimo configurado.
            </p>
          )}

          {!loading && topAlert && (
            <p className="mt-3 text-blue-100">
              <strong>{topAlert.productName}</strong> está com{" "}
              {topAlert.currentStock} unidade
              {topAlert.currentStock === 1 ? "" : "s"} (mínimo:{" "}
              {topAlert.minStock}).{" "}
              {stats.lowStockCount > 1
                ? `Mais ${stats.lowStockCount - 1} produto(s) em alerta.`
                : ""}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Layers className="text-cyan-300" />
            <h3 className="font-semibold">Opções em destaque</h3>
          </div>

          {loading && (
            <p className="mt-3 text-blue-100">Carregando...</p>
          )}

          {!loading && !topOption && (
            <p className="mt-3 text-blue-100">
              Nenhuma opção vendida para gerar insights.
            </p>
          )}

          {!loading && topOption && (
            <p className="mt-3 text-blue-100">
              <strong>{topOption.optionName}</strong> é a opção mais escolhida com{" "}
              {topOption.totalQuantity} venda
              {topOption.totalQuantity === 1 ? "" : "s"} (
              {formatCurrency(topOption.totalRevenue)} em adicionais).
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Wallet className="text-blue-300" />
            <h3 className="font-semibold">Melhor cliente</h3>
          </div>

          {loading && (
            <p className="mt-3 text-blue-100">Carregando...</p>
          )}

          {!loading && !topCustomer && (
            <p className="mt-3 text-blue-100">
              Nenhuma venda vinculada a clientes para gerar insights.
            </p>
          )}

          {!loading && topCustomer && (
            <p className="mt-3 text-blue-100">
              <strong>{topCustomer.customerName}</strong> lidera com{" "}
              {formatCurrency(topCustomer.totalSpent)} em{" "}
              {topCustomer.purchaseCount} compra(s).
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/clientes"
          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          Ver clientes
        </Link>

        <Link
          to="/financeiro"
          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          Ver financeiro
        </Link>

        <Link
          to="/estoque"
          className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          Ver estoque
        </Link>

        <Link
          to="/produtos"
          className="inline-flex items-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Ver produtos
        </Link>
      </div>
    </div>
  );
}
