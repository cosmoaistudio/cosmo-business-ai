import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Bot,
  Settings,
} from "lucide-react";

import Logo from "./Logo";

const menu = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    active: true,
  },
  {
    icon: Package,
    label: "Produtos",
  },
  {
    icon: ShoppingCart,
    label: "Pedidos",
  },
  {
    icon: Users,
    label: "Clientes",
  },
  {
    icon: Bot,
    label: "Cosmo AI",
  },
  {
    icon: Settings,
    label: "Configurações",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col bg-slate-950 border-r border-slate-800">

      <div className="p-6">
        <Logo />
      </div>

      <nav className="flex-1 px-4">

        {menu.map((item) => {

          const Icon = item.icon;

          return (

            <button
              key={item.label}
              className={`group mb-2 flex w-full items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300

              ${
                item.active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-700/30"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }

              `}
            >

              <Icon
                size={21}
                className="transition-transform duration-300 group-hover:scale-110"
              />

              <span className="font-medium">
                {item.label}
              </span>

            </button>

          );

        })}

      </nav>

      <div className="border-t border-slate-800 p-6">

        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5">

          <p className="text-sm font-semibold text-white">

            🚀 Upgrade PRO

          </p>

          <p className="mt-2 text-xs text-slate-400">

            Desbloqueie IA, Marketing,
            Financeiro e muito mais.

          </p>

        </div>

      </div>

    </aside>
  );
}