import {
  LayoutGrid,
  Palette,
  Type,
  PanelsTopLeft,
  Store,
  Image as ImageIcon,
  ShoppingBag,
  CreditCard,
  SlidersHorizontal,
  Sparkles,
  Tag,
  MousePointerClick,
  Layers,
} from "lucide-react";
import {
  MENU_EDITOR_NAV_GROUPS,
  type MenuEditorNavId,
  type MenuEditorSectionId,
} from "./menuEditor.types";
import type { MenuPreviewSelectable } from "./menuEditor.types";

const ICONS: Record<MenuEditorNavId, typeof Store> = {
  style: Sparkles,
  identity: Store,
  colors: Palette,
  typography: Type,
  layout: LayoutGrid,
  products: ShoppingBag,
  highlights: Tag,
  categories: Layers,
  banner: ImageIcon,
  buttons: MousePointerClick,
  cart: ShoppingBag,
  checkout: CreditCard,
  advanced: SlidersHorizontal,
};

interface MenuEditorSidebarProps {
  active: MenuEditorSectionId;
  activeNav?: MenuEditorNavId;
  dirtyNavIds?: MenuEditorNavId[];
  onChange: (
    section: MenuEditorSectionId,
    preview: MenuPreviewSelectable | null,
    navId: MenuEditorNavId
  ) => void;
}

export default function MenuEditorSidebar({
  active,
  activeNav,
  dirtyNavIds = [],
  onChange,
}: MenuEditorSidebarProps) {
  const dirty = new Set(dirtyNavIds);

  return (
    <nav aria-label="Seções do editor" className="space-y-5">
      {MENU_EDITOR_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {group.label}
          </p>
          <div className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
            {group.items.map((item) => {
              const Icon = ICONS[item.navId] ?? PanelsTopLeft;
              const isActive =
                activeNav === item.navId ||
                (!activeNav && item.section === active && item.navId === item.section);
              return (
                <button
                  key={item.navId}
                  type="button"
                  onClick={() => onChange(item.section, item.preview, item.navId)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-w-[9.5rem] shrink-0 items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 xl:min-w-0 ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {item.label}
                      {dirty.has(item.navId) ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-amber-300" : "bg-amber-500"
                          }`}
                          aria-label="Alterações nesta seção"
                        />
                      ) : null}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 block text-[11px] leading-snug ${
                        isActive ? "text-white/70" : "text-slate-400"
                      }`}
                    >
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
