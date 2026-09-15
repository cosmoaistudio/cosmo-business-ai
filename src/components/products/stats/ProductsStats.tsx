import {
  Package,
  CheckCircle2,
  XCircle,
  DollarSign,
} from "lucide-react";
import type { Product } from "@/features/products";
import { computeProductStats } from "@/features/products";
import { formatCurrency } from "@/lib/format";

interface ProductsStatsProps {
  products: Product[];
}

export default function ProductsStats({ products }: ProductsStatsProps) {
  const stats = computeProductStats(products);

  const items = [
    {
      title: "Total de Produtos",
      value: String(stats.total),
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Produtos Ativos",
      value: String(stats.active),
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },
    {
      title: "Produtos Inativos",
      value: String(stats.inactive),
      icon: XCircle,
      color: "bg-red-500",
    },
    {
      title: "Valor Estimado do Estoque",
      value: formatCurrency(stats.estimatedStockValue),
      icon: DollarSign,
      color: "bg-violet-500",
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
