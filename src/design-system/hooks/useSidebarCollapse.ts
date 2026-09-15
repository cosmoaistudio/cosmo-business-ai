import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cosmo:sidebar-collapsed";

function getTabletDefault(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
    return getTabletDefault();
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

  return { collapsed, setCollapsed, toggle };
}
