import { ShoppingBag, UserPlus, Users, Wallet } from "lucide-react";
import Card from "@/components/shared/Card";
import { formatCurrency } from "@/lib/format";
import type { CustomerOverviewStats } from "@/features/customers";

interface CustomersStatsProps {
  overview: CustomerOverviewStats;
  loading?: boolean;
}

export default function CustomersStats({
  overview,
  loading = false,
}: CustomersStatsProps) {
  const cards = [
    {
      label: "Total de clientes",
      value: loading ? "..." : String(overview.totalCustomers),
      icon: Users,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Novos hoje",
      value: loading ? "..." : String(overview.newCustomersToday),
      icon: UserPlus,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Com compras",
      value: loading ? "..." : String(overview.customersWithPurchases),
      icon: ShoppingBag,
      tone: "text-violet-600 bg-violet-50",
    },
    {
      label: "Receita vinculada",
      value: loading ? "..." : formatCurrency(overview.totalRevenue),
      icon: Wallet,
      tone: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {card.value}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}
            >
              <card.icon size={20} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
