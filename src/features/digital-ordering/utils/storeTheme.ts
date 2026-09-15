import type { DigitalStoreTheme } from "../types/digitalStore.types";

export function applyDigitalStoreTheme(theme: DigitalStoreTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--digital-primary", theme.primaryColor);
  root.style.setProperty("--digital-secondary", theme.secondaryColor);
  root.style.setProperty("--digital-accent", theme.accentColor);
  root.style.setProperty("--digital-bg", theme.backgroundColor);
}

export function clearDigitalStoreTheme() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.removeProperty("--digital-primary");
  root.style.removeProperty("--digital-secondary");
  root.style.removeProperty("--digital-accent");
  root.style.removeProperty("--digital-bg");
}
