import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Bot,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import Logo from "./Logo";

const menu = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },
  {
    icon: Package,
    label: "Produtos",
    path: "/produtos",
  },
  {
    icon: ShoppingCart,
    label: "Pedidos",
    path: "/pedidos",
  },
  {
    icon: Users,
    label: "Clientes",
    path: "/clientes",
  },
  {
    icon: Bot,
    label: "Cosmo AI",
    path: "/ia",
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/configuracoes",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-950">

      <div className="p-6">
        <Logo />
      </div>

      <nav className="flex-1 px-4">

        {menu.map((item) => {

          const Icon = item.icon;

          return (

            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `group mb-2 flex w-full items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-700/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >

              <Icon
                size={21}
                className="transition-transform duration-300 group-hover:scale-110"
              />

              <span className="font-medium">
                {item.label}
              </span>

            </NavLink>

          );

        })}

      </nav>

      <div className="border-t border-slate-800 p-6">

        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5">

          <p className="text-sm font-semibold text-white">
            🚀 Upgrade PRO
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Desbloqueie IA, Marketing, Financeiro e muito mais.
          </p>

        </div>

      </div>

    </aside>
  );
}