import { useMemo } from "react";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import { getNicheConfig } from "../config/nicheConfig";
import { resolveMenuTheme } from "../theme/menuTheme";
import type {
  DigitalMenuNiche,
  MenuThemeOverrides,
} from "../types/digitalMenu.types";

/**
 * Single place where niche config and theme are resolved, so the header, the
 * catalog and the cart bar always agree.
 */
export function useMenuTheme(
  store: DigitalStoreSettings | null,
  niche?: DigitalMenuNiche | null,
  overrides?: MenuThemeOverrides
) {
  const config = useMemo(
    () => getNicheConfig(niche ?? store?.niche),
    [niche, store?.niche]
  );

  const resolvedOverrides = overrides ?? store?.menuTheme;

  const theme = useMemo(
    () => resolveMenuTheme(store?.theme, config, resolvedOverrides),
    [store?.theme, config, resolvedOverrides]
  );

  return { config, theme };
}
