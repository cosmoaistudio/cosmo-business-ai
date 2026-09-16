import type { ReactNode } from "react";
import type {
  DigitalStoreSettings,
  DigitalStoreTheme,
} from "../../types/digitalStore.types";
import type {
  MenuBannerStyle,
  MenuButtonStyle,
  MenuDensity,
  MenuProductLayout,
  MenuRadius,
  MenuTheme,
  MenuThemeOverrides,
} from "../types/digitalMenu.types";

interface MenuThemeEditorProps {
  settings: DigitalStoreSettings;
  /** Fully resolved theme, so inherited niche defaults are visible. */
  resolvedTheme: MenuTheme;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
}

const COLOR_FIELDS: Array<{ key: keyof DigitalStoreTheme; label: string }> = [
  { key: "primaryColor", label: "Cor principal" },
  { key: "secondaryColor", label: "Cor secundária" },
  { key: "accentColor", label: "Cor de destaque" },
  { key: "backgroundColor", label: "Fundo" },
];

const BANNER_STYLES: Array<{ value: MenuBannerStyle; label: string }> = [
  { value: "image", label: "Imagem" },
  { value: "gradient", label: "Gradiente" },
  { value: "minimal", label: "Minimalista" },
];

const PRODUCT_LAYOUTS: Array<{ value: MenuProductLayout; label: string }> = [
  { value: "grid", label: "Grade" },
  { value: "list", label: "Lista" },
];

const DENSITIES: Array<{ value: MenuDensity; label: string }> = [
  { value: "comfortable", label: "Confortável" },
  { value: "compact", label: "Compacto" },
];

const CARD_RADII: Array<{ value: MenuRadius; label: string }> = [
  { value: "none", label: "Reto" },
  { value: "sm", label: "Suave" },
  { value: "md", label: "Médio" },
  { value: "lg", label: "Arredondado" },
  { value: "xl", label: "Muito arredondado" },
];

const BUTTON_STYLES: Array<{ value: MenuButtonStyle; label: string }> = [
  { value: "solid", label: "Preenchido" },
  { value: "soft", label: "Suave" },
  { value: "outline", label: "Contornado" },
];

function fieldClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm";
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-sm font-medium text-slate-700">
      {children}
    </span>
  );
}

/**
 * Visual editor over the MenuTheme tokens from Phase 1. Colors persist in the
 * legacy theme fields; the remaining tokens persist as menuTheme overrides.
 * Both live in the same existing jsonb column — no migration involved.
 */
export default function MenuThemeEditor({
  settings,
  resolvedTheme,
  onChange,
}: MenuThemeEditorProps) {
  const patchMenuTheme = (patch: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...patch } });
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Cores</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLOR_FIELDS.map((field) => (
            <label key={field.key}>
              <Label>{field.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.theme[field.key]}
                  onChange={(event) =>
                    onChange({
                      theme: { ...settings.theme, [field.key]: event.target.value },
                    })
                  }
                  className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-slate-200"
                  aria-label={field.label}
                />
                <input
                  value={settings.theme[field.key]}
                  onChange={(event) =>
                    onChange({
                      theme: { ...settings.theme, [field.key]: event.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Identidade e mensagem
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <Label>URL do logo</Label>
            <input
              value={settings.logoUrl ?? ""}
              onChange={(event) =>
                onChange({ logoUrl: event.target.value || null })
              }
              placeholder="https://..."
              className={fieldClass()}
            />
          </label>

          <label>
            <Label>URL do banner</Label>
            <input
              value={settings.bannerUrl ?? ""}
              onChange={(event) =>
                onChange({ bannerUrl: event.target.value || null })
              }
              placeholder="https://..."
              className={fieldClass()}
            />
          </label>

          <label className="md:col-span-2">
            <Label>Mensagem de boas-vindas</Label>
            <textarea
              value={settings.welcomeMessage}
              onChange={(event) =>
                onChange({ welcomeMessage: event.target.value })
              }
              rows={2}
              className={fieldClass()}
            />
          </label>

          <label className="md:col-span-2">
            <Label>Mensagem promocional do banner (opcional)</Label>
            <input
              value={settings.bannerMessage ?? ""}
              onChange={(event) =>
                onChange({ bannerMessage: event.target.value || null })
              }
              placeholder="Ex: Frete grátis acima de R$ 50"
              className={fieldClass()}
            />
          </label>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Modo visual
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <Label>Estilo do banner</Label>
            <select
              value={resolvedTheme.bannerStyle}
              onChange={(event) =>
                patchMenuTheme({
                  bannerStyle: event.target.value as MenuBannerStyle,
                })
              }
              className={fieldClass()}
            >
              {BANNER_STYLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Layout dos produtos</Label>
            <select
              value={resolvedTheme.productLayout}
              onChange={(event) =>
                patchMenuTheme({
                  productLayout: event.target.value as MenuProductLayout,
                })
              }
              className={fieldClass()}
            >
              {PRODUCT_LAYOUTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Densidade</Label>
            <select
              value={resolvedTheme.density}
              onChange={(event) =>
                patchMenuTheme({ density: event.target.value as MenuDensity })
              }
              className={fieldClass()}
            >
              {DENSITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Cantos dos cards</Label>
            <select
              value={resolvedTheme.cardRadius}
              onChange={(event) =>
                patchMenuTheme({ cardRadius: event.target.value as MenuRadius })
              }
              className={fieldClass()}
            >
              {CARD_RADII.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Label>Estilo dos botões</Label>
            <select
              value={resolvedTheme.buttonStyle}
              onChange={(event) =>
                patchMenuTheme({
                  buttonStyle: event.target.value as MenuButtonStyle,
                })
              }
              className={fieldClass()}
            >
              {BUTTON_STYLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 self-end rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={resolvedTheme.showProductImages}
              onChange={(event) =>
                patchMenuTheme({ showProductImages: event.target.checked })
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">
              Mostrar imagens dos produtos
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}
