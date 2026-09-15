import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  Brain,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Search,
  Settings,
  Sparkles,
  Stethoscope,
  Store,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { canAccessRoute, type AppRoute, useAuth } from "@/features/auth";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  path: AppRoute;
  icon: LucideIcon;
  keywords: string;
}

const COMMANDS: CommandItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Centro de comando",
    path: "/",
    icon: LayoutDashboard,
    keywords: "inicio home dashboard comando",
  },
  {
    id: "pdv",
    label: "PDV",
    description: "Abrir ponto de venda",
    path: "/pdv",
    icon: Store,
    keywords: "venda caixa pdv pos",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    description: "Central de pedidos e cozinha",
    path: "/pedidos",
    icon: ClipboardList,
    keywords: "pedidos orders fila",
  },
  {
    id: "cozinha",
    label: "Cozinha",
    description: "Painel KDS",
    path: "/cozinha",
    icon: ChefHat,
    keywords: "cozinha kds preparo",
  },
  {
    id: "produtos",
    label: "Produtos",
    description: "Catálogo de produtos",
    path: "/produtos",
    icon: Package,
    keywords: "produtos catalogo",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    description: "Caixa e lançamentos",
    path: "/financeiro",
    icon: Wallet,
    keywords: "financeiro caixa receita",
  },
  {
    id: "clientes",
    label: "Clientes",
    description: "Base de clientes",
    path: "/clientes",
    icon: Users,
    keywords: "clientes crm",
  },
  {
    id: "ia",
    label: "Cosmo AI",
    description: "Gerente operacional",
    path: "/ia",
    icon: Sparkles,
    keywords: "ia ai cosmo insights",
  },
  {
    id: "brain",
    label: "Business Brain",
    description: "Cérebro operacional e análises",
    path: "/cerebro",
    icon: Brain,
    keywords: "cerebro brain saude insights alertas metas",
  },
  {
    id: "growth",
    label: "Growth Hub",
    description: "Marketing, conteúdo e tráfego",
    path: "/crescimento",
    icon: TrendingUp,
    keywords: "crescimento growth marketing campanhas trafego ideias",
  },
  {
    id: "config",
    label: "Configurações",
    description: "Conta, empresa, equipe e sistema",
    path: "/configuracoes",
    icon: Settings,
    keywords: "configuracoes settings",
  },
  {
    id: "plan",
    label: "Meu Plano",
    description: "Assinatura, limites e uso",
    path: "/meu-plano",
    icon: CreditCard,
    keywords: "plano assinatura billing stripe mercadopago",
  },
  {
    id: "help",
    label: "Central de Ajuda",
    description: "Documentação, tutoriais e suporte",
    path: "/ajuda",
    icon: LifeBuoy,
    keywords: "ajuda help suporte tutoriais",
  },
  {
    id: "diagnostics",
    label: "Diagnóstico",
    description: "Status, agent, supabase e versão",
    path: "/diagnostico",
    icon: Stethoscope,
    keywords: "diagnostico status agent supabase versao",
  },
];

export default function GlobalCommandSearch() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const role = profile?.role;
    const allowed = COMMANDS.filter((item) => canAccessRoute(role, item.path));
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allowed.slice(0, 8);
    return allowed
      .filter((item) =>
        `${item.label} ${item.description} ${item.keywords}`
          .toLowerCase()
          .includes(normalized)
      )
      .slice(0, 8);
  }, [profile?.role, query]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function go(path: AppRoute) {
    navigate(path);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex].path);
    }
  }

  return (
    <div ref={rootRef} className="cosmo-cmd-search relative min-w-0 flex-1 max-w-xl">
      <div className="cosmo-search-shell flex items-center gap-3 rounded-xl px-3.5 py-2">
        <Search className="shrink-0 text-slate-500" size={17} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder="Pesquisar telas e ações..."
          className="h-8 w-full border-0 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          aria-label="Pesquisa global"
          aria-expanded={open}
          aria-controls="cosmo-global-search-results"
          autoComplete="off"
        />
        <span className="cosmo-os-kbd" aria-hidden>
          Ctrl K
        </span>
      </div>

      {open ? (
        <div
          id="cosmo-global-search-results"
          className="cosmo-cmd-search__panel absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]/98 shadow-2xl backdrop-blur-xl"
          role="listbox"
        >
          {results.length === 0 ? (
            <p className="px-4 py-5 text-sm text-slate-400">
              Nenhum resultado. Tente “PDV”, “Clientes” ou “Financeiro”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
                        active
                          ? "bg-sky-500/15 text-white"
                          : "text-slate-200 hover:bg-white/[0.04]"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => go(item.path)}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-sky-300">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
