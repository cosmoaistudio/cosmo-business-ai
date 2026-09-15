import {
  Blocks,
  Brain,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  ListChecks,
  Package,
  Plug,
  Printer,
  Radar,
  CreditCard,
  Settings,
  Sparkles,
  Stethoscope,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  SidebarNavGroup,
  SidebarNavItem,
  SidebarShell,
  useSidebarCollapse,
} from "@/design-system";
import "@/design-system/styles/design-system.css";

import { canAccessRoute, type AppRoute } from "@/features/auth";
import { useAuth } from "@/features/auth/context/AuthContext";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: AppRoute;
  end?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    id: "operation",
    label: "Operação",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/", end: true },
      { icon: Radar, label: "Centro de Operações", path: "/operacoes" },
      { icon: Store, label: "PDV", path: "/pdv" },
      { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
      { icon: ChefHat, label: "Cozinha", path: "/cozinha" },
    ],
  },
  {
    id: "management",
    label: "Gestão",
    items: [
      { icon: Wallet, label: "Financeiro", path: "/financeiro" },
      { icon: Users, label: "Clientes", path: "/clientes" },
      { icon: Warehouse, label: "Estoque", path: "/estoque" },
    ],
  },
  {
    id: "catalog",
    label: "Catálogo",
    items: [
      { icon: Package, label: "Produtos", path: "/produtos", end: true },
      { icon: ListChecks, label: "Grupos de Opções", path: "/opcoes/grupos" },
      { icon: Layers, label: "Itens de Opções", path: "/opcoes/itens" },
      { icon: Blocks, label: "Product Builder", path: "/produtos/builder" },
    ],
  },
  {
    id: "intelligence",
    label: "Inteligência",
    items: [
      { icon: Sparkles, label: "Cosmo AI", path: "/ia" },
      { icon: Brain, label: "Business Brain", path: "/cerebro" },
      { icon: Workflow, label: "Automações", path: "/automacoes" },
    ],
  },
  {
    id: "growth",
    label: "Crescimento",
    items: [
      { icon: TrendingUp, label: "Growth Hub", path: "/crescimento" },
    ],
  },
  {
    id: "system",
    label: "Sistema",
    items: [
      { icon: CreditCard, label: "Meu Plano", path: "/meu-plano" },
      { icon: Settings, label: "Configurações", path: "/configuracoes" },
      {
        icon: Plug,
        label: "Pedido Digital",
        path: "/configuracoes/pedido-digital",
      },
      {
        icon: Printer,
        label: "Hardware",
        path: "/configuracoes/hardware",
      },
      { icon: LifeBuoy, label: "Central de Ajuda", path: "/ajuda" },
      { icon: Stethoscope, label: "Diagnóstico", path: "/diagnostico" },
    ],
  },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const role = profile?.role;
  const { collapsed, toggle } = useSidebarCollapse();

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(role, item.path)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <SidebarShell
      collapsed={collapsed}
      onToggle={toggle}
      footer={
        <div className="cosmo-v2-sidebar__meta">
          <span className="cosmo-v2-sidebar__badge">Piloto</span>
          {profile?.organizations?.name ? (
            <p className="cosmo-v2-sidebar__org" title={profile.organizations.name}>
              {profile.organizations.name}
            </p>
          ) : null}
        </div>
      }
    >
      {visibleGroups.map((group) => (
        <SidebarNavGroup key={group.id} label={group.label} collapsed={collapsed}>
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              end={item.end}
              badge={item.badge}
            />
          ))}
        </SidebarNavGroup>
      ))}
    </SidebarShell>
  );
}
