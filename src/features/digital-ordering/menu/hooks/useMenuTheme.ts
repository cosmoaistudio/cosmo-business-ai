import { useMemo } from "react";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import {
  getNicheConfig,
  getNicheConfigForTemplate,
} from "../config/nicheConfig";
import { resolveMenuTheme } from "../theme/menuTheme";
import {
  resolveEffectiveProductImages,
  resolveMenuCopy,
  resolveMenuFeatures,
} from "../utils/resolveMenuPresentation";
import {
  getActiveMenuTemplate,
  resolveActiveTemplateId,
} from "../templates/resolveMenuTemplate";
import type {
  DigitalMenuNiche,
  MenuThemeOverrides,
  NicheCopy,
  NicheFeatures,
} from "../types/digitalMenu.types";
import type { MenuTemplateId } from "../types/menuTemplate.types";

/**
 * Single place where template, niche, copy, features and theme are resolved.
 */
export function useMenuTheme(
  store: DigitalStoreSettings | null,
  niche?: DigitalMenuNiche | null,
  overrides?: MenuThemeOverrides
) {
  const templateId = useMemo(
    () =>
      resolveActiveTemplateId({
        menuTemplateId: store?.menuTemplateId,
        niche: niche ?? store?.niche,
      }),
    [store?.menuTemplateId, niche, store?.niche]
  );

  const template = useMemo(
    () => getActiveMenuTemplate({ menuTemplateId: templateId }),
    [templateId]
  );

  const config = useMemo(
    () =>
      getNicheConfigForTemplate(niche ?? store?.niche, templateId as MenuTemplateId),
    [niche, store?.niche, templateId]
  );

  const resolvedOverrides = overrides ?? store?.menuTheme;

  const theme = useMemo(
    () => resolveMenuTheme(store?.theme, config, resolvedOverrides),
    [store?.theme, config, resolvedOverrides]
  );

  const copy: NicheCopy = useMemo(
    () => resolveMenuCopy(config, store?.menuCopy),
    [config, store?.menuCopy]
  );

  const features: NicheFeatures = useMemo(
    () => resolveMenuFeatures(config, store?.menuFeatures),
    [config, store?.menuFeatures]
  );

  const { allowed: allowsProductImages, enabled: showProductImages } = useMemo(
    () =>
      resolveEffectiveProductImages(
        config,
        resolvedOverrides,
        store?.menuFeatures
      ),
    [config, resolvedOverrides, store?.menuFeatures]
  );

  const mergedConfig = useMemo(
    () => ({ ...config, copy, features }),
    [config, copy, features]
  );

  const nicheConfig = useMemo(
    () => getNicheConfig(niche ?? store?.niche),
    [niche, store?.niche]
  );

  return {
    config: mergedConfig,
    theme,
    copy,
    features,
    showProductImages,
    allowsProductImages,
    template,
    templateId,
    /** @deprecated use config from template-aware resolution */
    nicheConfig,
  };
}
