import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Store,
  Tag,
  UserPlus,
} from "lucide-react";

const ACTIONS = [
  {
    label: "Abrir PDV",
    href: "/pdv",
    icon: Store,
    tone: "bg-blue-600 text-white hover:bg-blue-500",
  },
  {
    label: "Cadastrar Produto",
    href: "/produtos",
    icon: Package,
    tone: "bg-white text-slate-900 hover:bg-slate-50",
  },
  {
    label: "Entrada de Estoque",
    href: "/estoque",
    icon: ArrowUpCircle,
    tone: "bg-white text-slate-900 hover:bg-slate-50",
  },
  {
    label: "Saída Manual",
    href: "/estoque",
    icon: ArrowDownCircle,
    tone: "bg-white text-slate-900 hover:bg-slate-50",
  },
  {
    label: "Novo Cliente",
    href: "/clientes",
    icon: UserPlus,
    tone: "bg-white text-slate-900 hover:bg-slate-50",
  },
  {
    label: "Nova Promoção",
    href: "/automacoes/nova",
    icon: Tag,
    tone: "bg-white text-slate-900 hover:bg-slate-50",
  },
];

export default function QuickActionsCard() {
  return (
    <div className="cosmo-card p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Ações rápidas</h2>
      <p className="mt-1 text-sm text-slate-500">
        Atalhos para resolver a operação agora.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              to={action.href}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold transition ${action.tone}`}
            >
              <Icon size={16} />
              {action.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
