import {
  AlertTriangle,
  ArrowUpFromLine,
  Package,
  Boxes,
} from "lucide-react";
import type { InventoryStats } from "../types/inventory";

interface InventoryStatsProps {
  stats: InventoryStats;
  loading?: boolean;
}

export default function InventoryStats({
  stats,
  loading = false,
}: InventoryStatsProps) {
  const items = [
    {
      title: "Produtos cadastrados",
      value: loading ? "..." : String(stats.totalProducts),
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Unidades em estoque",
      value: loading ? "..." : String(stats.totalUnits),
      icon: Boxes,
      color: "bg-violet-500",
    },
    {
      title: "Estoque baixo",
      value: loading ? "..." : String(stats.lowStockCount),
      icon: AlertTriangle,
      color: "bg-amber-500",
    },
    {
      title: "Movimentações hoje",
      value: loading ? "..." : String(stats.movementsToday),
      icon: ArrowUpFromLine,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} text-white`}
              >
                <Icon size={26} />
              </div>
            </div>

            <h3 className="mt-6 text-sm text-slate-500">{item.title}</h3>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
