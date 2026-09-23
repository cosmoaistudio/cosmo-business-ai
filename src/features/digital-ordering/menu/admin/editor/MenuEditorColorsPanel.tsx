import type { DigitalStoreSettings, DigitalStoreTheme } from "../../../types/digitalStore.types";
import type { MenuTheme, MenuThemeOverrides } from "../../types/digitalMenu.types";
import { appearanceFromTemplate } from "../../templates/resolveMenuTemplate";
import type { MenuTemplateId } from "../../types/menuTemplate.types";
import { buttonStyleFor, evaluateMenuContrast, radiusToCss } from "../../theme/menuTheme";
import MenuColorField from "./MenuColorField";
import MenuEditorSection from "./MenuEditorSection";

interface MenuEditorColorsPanelProps {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  activeTemplateId: MenuTemplateId;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onResetColors: () => void;
}

type ColorKey =
  | keyof DigitalStoreTheme
  | "surfaceColor"
  | "surfaceElevated"
  | "surfaceMuted"
  | "textColor"
  | "mutedTextColor"
  | "successColor"
  | "warningColor"
  | "errorColor";

const GROUPS: Array<{
  title: string;
  fields: Array<{ key: ColorKey; label: string; source: "theme" | "menuTheme" }>;
}> = [
  {
    title: "Identidade",
    fields: [
      { key: "primaryColor", label: "Cor principal", source: "theme" },
      { key: "secondaryColor", label: "Cor secundária", source: "theme" },
      { key: "accentColor", label: "Cor de destaque", source: "theme" },
    ],
  },
  {
    title: "Superfícies",
    fields: [
      { key: "backgroundColor", label: "Fundo", source: "theme" },
      { key: "surfaceColor", label: "Superfície", source: "menuTheme" },
      { key: "surfaceElevated", label: "Superfície elevada", source: "menuTheme" },
      { key: "surfaceMuted", label: "Superfície suave", source: "menuTheme" },
    ],
  },
  {
    title: "Tipografia",
    fields: [
      { key: "textColor", label: "Texto principal", source: "menuTheme" },
      { key: "mutedTextColor", label: "Texto secundário", source: "menuTheme" },
    ],
  },
  {
    title: "Estados",
    fields: [
      { key: "successColor", label: "Sucesso", source: "menuTheme" },
      { key: "warningColor", label: "Aviso", source: "menuTheme" },
      { key: "errorColor", label: "Erro", source: "menuTheme" },
    ],
  },
];

function readColor(
  settings: DigitalStoreSettings,
  theme: MenuTheme,
  key: ColorKey,
  source: "theme" | "menuTheme"
): string {
  if (source === "theme") {
    return settings.theme[key as keyof DigitalStoreTheme];
  }
  return String(
    settings.menuTheme?.[key as keyof MenuThemeOverrides] ??
      theme[key as keyof MenuTheme] ??
      "#ffffff"
  );
}

export default function MenuEditorColorsPanel({
  settings,
  resolvedTheme,
  activeTemplateId,
  onChange,
  onResetColors,
}: MenuEditorColorsPanelProps) {
  const patchMenuTheme = (patch: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...patch } });
  };

  const setColor = (
    key: ColorKey,
    source: "theme" | "menuTheme",
    value: string
  ) => {
    if (source === "theme") {
      onChange({ theme: { ...settings.theme, [key]: value } });
      return;
    }
    patchMenuTheme({ [key]: value } as MenuThemeOverrides);
  };

  const resetOne = (key: ColorKey, source: "theme" | "menuTheme") => {
    const appearance = appearanceFromTemplate(activeTemplateId);
    if (source === "theme") {
      const seed = appearance.theme[key as keyof typeof appearance.theme];
      if (typeof seed === "string") {
        onChange({ theme: { ...settings.theme, [key]: seed } });
      }
      return;
    }
    const next = { ...(settings.menuTheme ?? {}) };
    delete next[key as keyof MenuThemeOverrides];
    const seeded = appearance.menuTheme[key as keyof MenuThemeOverrides];
    if (typeof seeded === "string") {
      (next as Record<string, string>)[key] = seeded;
    }
    onChange({ menuTheme: next });
  };

  const contrastReport = evaluateMenuContrast(resolvedTheme);
  const lowPairs = contrastReport.pairs.filter((pair) => pair.level === "low");

  return (
    <MenuEditorSection
      title="Cores"
      description="Combine com a identidade visual da marca. Alterações aparecem no preview na hora."
      actions={
        <button
          type="button"
          onClick={onResetColors}
          className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          Restaurar cores do template
        </button>
      }
    >
      <div
        className="mb-6 grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2"
        style={{ backgroundColor: resolvedTheme.backgroundColor }}
        aria-label="Prévia das cores"
      >
        <div
          className="rounded-xl border p-3"
          style={{
            backgroundColor: resolvedTheme.surfaceColor,
            borderColor: resolvedTheme.borderColor,
            borderRadius: radiusToCss(resolvedTheme.cardRadius),
            color: resolvedTheme.textColor,
          }}
        >
          <p className="text-xs" style={{ color: resolvedTheme.mutedTextColor }}>
            Card
          </p>
          <p className="mt-1 font-semibold">Produto exemplo</p>
          <span
            className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{
              backgroundColor: resolvedTheme.accentColor,
              color: "#fff",
            }}
          >
            Badge
          </span>
        </div>
        <div className="flex flex-col justify-between gap-2">
          <p style={{ color: resolvedTheme.textColor }}>Texto principal</p>
          <p className="text-sm" style={{ color: resolvedTheme.mutedTextColor }}>
            Texto secundário
          </p>
          <button
            type="button"
            className="px-3 py-2 text-sm font-semibold"
            style={buttonStyleFor(resolvedTheme)}
          >
            Botão
          </button>
          <p className="text-[11px]" style={{ color: resolvedTheme.mutedTextColor }}>
            Contraste:{" "}
            {contrastReport.hasLowContrast
              ? `${lowPairs.length} combinação(ões) com aviso`
              : "sem avisos automáticos"}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {group.title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const value = readColor(
                  settings,
                  resolvedTheme,
                  field.key,
                  field.source
                );
                return (
                  <div key={field.key} className="space-y-1.5">
                    <MenuColorField
                      label={field.label}
                      value={value}
                      onChange={(next) =>
                        setColor(field.key, field.source, next)
                      }
                      contrastAgainst={
                        field.key === "textColor" ||
                        field.key === "mutedTextColor"
                          ? resolvedTheme.surfaceColor
                          : field.key === "primaryColor" ||
                              field.key === "accentColor"
                            ? resolvedTheme.backgroundColor
                            : field.key === "successColor" ||
                                field.key === "warningColor" ||
                                field.key === "errorColor"
                              ? resolvedTheme.surfaceColor
                              : field.key === "secondaryColor"
                                ? resolvedTheme.backgroundColor
                                : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => resetOne(field.key, field.source)}
                      className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                    >
                      Reset individual
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {lowPairs.length > 0 ? (
        <p className="mt-6 text-xs text-amber-700" role="status">
          Aviso de contraste (não bloqueia a escolha):{" "}
          {lowPairs.map((pair) => pair.label).join(" · ")}
        </p>
      ) : null}
    </MenuEditorSection>
  );
}
