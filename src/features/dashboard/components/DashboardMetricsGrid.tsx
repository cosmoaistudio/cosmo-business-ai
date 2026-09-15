import {
  AlertTriangle,
  Receipt,
  Repeat,
  Sun,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardStats } from "../types/dashboard";
import DashboardMetricCard from "./DashboardMetricCard";

interface DashboardMetricsGridProps {
  stats: DashboardStats;
  loading?: boolean;
}

export default function DashboardMetricsGrid({
  stats,
  loading = false,
}: DashboardMetricsGridProps) {
  const revenueSparkline = stats.salesByDay.map((d) => d.revenue);
  const ordersSparkline = stats.salesByDay.map((d) => d.salesCount);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
      <DashboardMetricCard
        title="Receita Hoje"
        value={formatCurrency(stats.todayRevenue)}
        subtitle={`${stats.todaySales} venda(s) hoje`}
        icon={<Sun size={20} />}
        accent="indigo"
        comparison={stats.comparisons.revenueTodayVsYesterday}
        sparklineValues={revenueSparkline}
        loading={loading}
        animationDelay={0}
      />

      <DashboardMetricCard
        title="Pedidos"
        value={formatNumber(stats.todaySales)}
        subtitle="Concluídos hoje"
        icon={<Receipt size={20} />}
        accent="blue"
        sparklineValues={ordersSparkline}
        loading={loading}
        animationDelay={0.05}
      />

      <DashboardMetricCard
        title="Ticket Médio"
        value={formatCurrency(stats.averageTicket)}
        subtitle={`${formatCurrency(stats.todayAverageTicket)} hoje`}
        icon={<Repeat size={20} />}
        accent="cyan"
        comparison={stats.ticketComparison}
        sparklineValues={revenueSparkline.map((r, i) =>
          ordersSparkline[i] ? r / ordersSparkline[i] : 0
        )}
        loading={loading}
        animationDelay={0.1}
      />

      <DashboardMetricCard
        title="Estoque Baixo"
        value={formatNumber(stats.lowStockCount)}
        subtitle={`${stats.outOfStockCount} sem estoque`}
        icon={<AlertTriangle size={20} />}
        accent="amber"
        loading={loading}
        animationDelay={0.15}
      />
    </section>
  );
}
