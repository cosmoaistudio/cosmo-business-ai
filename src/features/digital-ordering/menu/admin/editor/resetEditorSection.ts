import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type { MenuThemeOverrides } from "../../types/digitalMenu.types";
import { appearanceFromTemplate } from "../../templates/resolveMenuTemplate";
import type { MenuTemplateId } from "../../types/menuTemplate.types";
import {
  resolveEditorPanelSection,
  type MenuEditorSectionId,
} from "./menuEditor.types";

function compactTheme(patch: MenuThemeOverrides): MenuThemeOverrides {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as MenuThemeOverrides;
}

function mergeTheme(
  current: MenuThemeOverrides | undefined,
  patch: MenuThemeOverrides
): MenuThemeOverrides {
  return { ...(current ?? {}), ...compactTheme(patch) };
}

/**
 * Restore only the requested editor section from the active template.
 * Identity (name, logo, slug) and commercial settings stay untouched.
 */
export function resetSectionPatch(
  section: MenuEditorSectionId,
  templateId: MenuTemplateId,
  settings: DigitalStoreSettings
): Partial<DigitalStoreSettings> {
  const appearance = appearanceFromTemplate(templateId);
  const panel = resolveEditorPanelSection(section);

  switch (panel) {
    case "colors":
      return {
        theme: appearance.theme,
        menuTheme: mergeTheme(settings.menuTheme, {
          surfaceColor: appearance.menuTheme.surfaceColor,
          surfaceElevated: appearance.menuTheme.surfaceElevated,
          surfaceMuted: appearance.menuTheme.surfaceMuted,
          textColor: appearance.menuTheme.textColor,
          mutedTextColor: appearance.menuTheme.mutedTextColor,
          borderColor: appearance.menuTheme.borderColor,
          successColor: appearance.menuTheme.successColor,
          warningColor: appearance.menuTheme.warningColor,
          errorColor: appearance.menuTheme.errorColor,
          primaryColor: appearance.menuTheme.primaryColor,
          secondaryColor: appearance.menuTheme.secondaryColor,
          accentColor: appearance.menuTheme.accentColor,
          backgroundColor: appearance.menuTheme.backgroundColor,
        }),
      };
    case "typography":
      return {
        menuTheme: mergeTheme(settings.menuTheme, {
          fontFamily: appearance.menuTheme.fontFamily,
          headingFontFamily: appearance.menuTheme.headingFontFamily,
          baseFontSize: appearance.menuTheme.baseFontSize,
          headingFontWeight: appearance.menuTheme.headingFontWeight,
          bodyFontWeight: appearance.menuTheme.bodyFontWeight,
          headingScale: appearance.menuTheme.headingScale,
        }),
      };
    case "layout":
      return {
        menuTheme: mergeTheme(settings.menuTheme, {
          productLayout: appearance.menuTheme.productLayout,
          density: appearance.menuTheme.density,
          contentWidth: appearance.menuTheme.contentWidth,
          catalogColumns: appearance.menuTheme.catalogColumns,
          cardRadius: appearance.menuTheme.cardRadius,
          buttonRadius: appearance.menuTheme.buttonRadius,
          imageAspect: appearance.menuTheme.imageAspect,
          pricePosition: appearance.menuTheme.pricePosition,
          ctaPosition: appearance.menuTheme.ctaPosition,
        }),
      };
    case "banner":
      return {
        menuTheme: mergeTheme(settings.menuTheme, {
          bannerStyle: appearance.menuTheme.bannerStyle,
          bannerHeight: appearance.menuTheme.bannerHeight,
          bannerOverlay: appearance.menuTheme.bannerOverlay,
          bannerRadius: appearance.menuTheme.bannerRadius,
        }),
      };
    case "products":
      return {
        menuTheme: mergeTheme(settings.menuTheme, {
          cardStyle: appearance.menuTheme.cardStyle,
          imageSize: appearance.menuTheme.imageSize,
          showProductImages: appearance.menuTheme.showProductImages,
          pricePosition: appearance.menuTheme.pricePosition,
          ctaPosition: appearance.menuTheme.ctaPosition,
        }),
        menuFeatures: appearance.menuFeatures,
      };
    case "buttons":
      return {
        menuTheme: mergeTheme(settings.menuTheme, {
          buttonStyle: appearance.menuTheme.buttonStyle,
          buttonHeight: appearance.menuTheme.buttonHeight,
          buttonFontWeight: appearance.menuTheme.buttonFontWeight,
          buttonShadow: appearance.menuTheme.buttonShadow,
          buttonRadius: appearance.menuTheme.buttonRadius,
        }),
      };
    case "categories":
      return {
        menuFeatures: {
          ...(settings.menuFeatures ?? {}),
          showCategoryTabs: appearance.menuFeatures.showCategoryTabs,
          showSearch: appearance.menuFeatures.showSearch,
          catalogNavigation: appearance.menuFeatures.catalogNavigation,
        },
      };
    case "checkout":
      return { menuCopy: appearance.menuCopy };
    case "style":
    case "advanced":
      return {
        menuTemplateId: appearance.templateId,
        niche: appearance.niche,
        theme: appearance.theme,
        menuTheme: appearance.menuTheme,
        menuCopy: appearance.menuCopy,
        menuFeatures: appearance.menuFeatures,
      };
    case "identity":
    default:
      return {
        menuTheme: mergeTheme(settings.menuTheme, {
          logoSize: appearance.menuTheme.logoSize,
          headerAlign: appearance.menuTheme.headerAlign,
        }),
      };
  }
}

export function sectionSnapshot(
  section: MenuEditorSectionId,
  source: DigitalStoreSettings
): Partial<DigitalStoreSettings> {
  const panel = resolveEditorPanelSection(section);
  switch (panel) {
    case "colors":
      return { theme: source.theme, menuTheme: source.menuTheme };
    case "checkout":
      return { menuCopy: source.menuCopy };
    case "categories":
      return { menuFeatures: source.menuFeatures };
    case "products":
      return {
        menuTheme: source.menuTheme,
        menuFeatures: source.menuFeatures,
      };
    case "style":
    case "advanced":
      return {
        menuTemplateId: source.menuTemplateId,
        niche: source.niche,
        theme: source.theme,
        menuTheme: source.menuTheme,
        menuCopy: source.menuCopy,
        menuFeatures: source.menuFeatures,
      };
    case "identity":
      return {
        organizationName: source.organizationName,
        welcomeMessage: source.welcomeMessage,
        logoUrl: source.logoUrl,
        bannerMessage: source.bannerMessage,
        menuTheme: source.menuTheme,
        menuCopy: source.menuCopy,
      };
    default:
      return { menuTheme: source.menuTheme };
  }
}

export function sectionHasDraftChanges(
  section: MenuEditorSectionId,
  draft: DigitalStoreSettings,
  saved: DigitalStoreSettings
): boolean {
  return (
    JSON.stringify(sectionSnapshot(section, draft)) !==
    JSON.stringify(sectionSnapshot(section, saved))
  );
}

export function hasVisualCustomization(
  settings: DigitalStoreSettings,
  templateId: MenuTemplateId = settings.menuTemplateId ?? "generic"
): boolean {
  const appearance = appearanceFromTemplate(templateId);
  const theme = settings.menuTheme ?? {};
  const copy = settings.menuCopy ?? {};

  for (const [key, value] of Object.entries(theme)) {
    if (value !== appearance.menuTheme[key as keyof typeof appearance.menuTheme]) {
      return true;
    }
  }

  for (const [key, value] of Object.entries(copy)) {
    if (value !== appearance.menuCopy[key as keyof typeof appearance.menuCopy]) {
      return true;
    }
  }

  return false;
}
