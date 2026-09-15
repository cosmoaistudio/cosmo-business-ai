import { designTokens } from "../tokens/designTokens";

export type ThemeMode = "dark" | "light";

export interface CosmoTheme {
  mode: ThemeMode;
  tokens: typeof designTokens;
}

const darkTheme: CosmoTheme = {
  mode: "dark",
  tokens: designTokens,
};

export class ThemeEngine {
  private theme: CosmoTheme = darkTheme;

  getTheme() {
    return this.theme;
  }

  applyToDocument(root: HTMLElement = document.documentElement) {
    const { colors, radius } = this.theme.tokens;

    root.style.setProperty("--cosmo-bg", colors.background);
    root.style.setProperty("--cosmo-bg-elevated", colors.backgroundElevated);
    root.style.setProperty("--cosmo-primary", colors.primary);
    root.style.setProperty("--cosmo-secondary", colors.secondary);
    root.style.setProperty("--cosmo-success", colors.success);
    root.style.setProperty("--cosmo-warning", colors.warning);
    root.style.setProperty("--cosmo-danger", colors.danger);
    root.style.setProperty("--cosmo-text", colors.text);
    root.style.setProperty("--cosmo-text-muted", colors.textMuted);
    root.style.setProperty("--cosmo-radius-lg", radius.lg);
    root.style.setProperty("--cosmo-radius-xl", radius.xl);
    root.style.setProperty("--cosmo-radius-2xl", radius["2xl"]);

    root.classList.add("dark");
    root.dataset.theme = this.theme.mode;
  }
}

export const themeEngine = new ThemeEngine();
