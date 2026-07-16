import {
  Package,
  AlertTriangle,
  Layers3,
  DollarSign,
} from "lucide-react";

const stats = [
  {
    title: "Produtos",
    value: "128",
    icon: Package,
    color: "bg-blue-500",
  },
  {
    title: "Estoque Baixo",
    value: "7",
    icon: AlertTriangle,
    color: "bg-amber-500",
  },
  {
    title: "Categorias",
    value: "12",
    icon: Layers3,
    color: "bg-violet-500",
  },
  {
    title: "Valor em Estoque",
    value: "R$ 38.450",
    icon: DollarSign,
    color: "bg-emerald-500",
  },
];

export default function ProductsStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
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

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Hoje
              </span>
            </div>

            <h3 className="mt-6 text-sm text-slate-500">
              {item.title}
            </h3>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}