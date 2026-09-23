import type { DigitalStoreTheme } from "../types/digitalStore.types";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import { menuThemeToCssVars } from "../menu/theme/menuTheme";

/** Legacy 4-color apply — kept for callers that only have DigitalStoreTheme. */
export function applyDigitalStoreTheme(theme: DigitalStoreTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--digital-primary", theme.primaryColor);
  root.style.setProperty("--digital-secondary", theme.secondaryColor);
  root.style.setProperty("--digital-accent", theme.accentColor);
  root.style.setProperty("--digital-bg", theme.backgroundColor);
}

/** Full MenuTheme → document CSS vars (commerce + catalog aliases). */
export function applyMenuThemeToDocument(theme: MenuTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const vars = menuThemeToCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function clearDigitalStoreTheme() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const keys = [
    "--digital-primary",
    "--digital-secondary",
    "--digital-accent",
    "--digital-bg",
    "--digital-surface",
    "--digital-text",
    "--digital-muted",
    "--digital-border",
    "--digital-font",
    "--digital-font-heading",
    "--digital-radius-card",
    "--digital-radius-button",
    "--menu-primary",
    "--menu-secondary",
    "--menu-accent",
    "--menu-bg",
    "--menu-surface",
    "--menu-text",
    "--menu-text-muted",
    "--menu-border",
    "--menu-font",
    "--menu-font-heading",
    "--menu-card-radius",
    "--menu-button-radius",
  ];
  for (const key of keys) {
    root.style.removeProperty(key);
  }
}
