import { createContext, useContext, type ReactNode } from "react";
import type { MenuPreviewSelectable } from "./menuEditor.types";

export type MenuPreviewInteraction = "edit" | "view";

export interface MenuPreviewSelectContextValue {
  enabled: boolean;
  selected: MenuPreviewSelectable | null;
  onSelect: (target: MenuPreviewSelectable) => void;
}

const MenuPreviewSelectContext =
  createContext<MenuPreviewSelectContextValue | null>(null);

export function MenuPreviewSelectProvider({
  enabled,
  selected,
  onSelect,
  children,
}: MenuPreviewSelectContextValue & { children: ReactNode }) {
  return (
    <MenuPreviewSelectContext.Provider value={{ enabled, selected, onSelect }}>
      {children}
    </MenuPreviewSelectContext.Provider>
  );
}

export function useMenuPreviewSelect() {
  return useContext(MenuPreviewSelectContext);
}
