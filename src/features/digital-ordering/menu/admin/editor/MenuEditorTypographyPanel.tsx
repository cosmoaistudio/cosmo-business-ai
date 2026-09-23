import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type {
  MenuFontSize,
  MenuFontWeight,
  MenuHeadingScale,
  MenuTheme,
  MenuThemeOverrides,
} from "../../types/digitalMenu.types";
import { fontWeightCss } from "../../theme/menuTheme";
import MenuEditorSection from "./MenuEditorSection";
import MenuLayoutField from "./MenuLayoutField";
import MenuTypographyField from "./MenuTypographyField";

interface Props {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onResetSection?: () => void;
}

export default function MenuEditorTypographyPanel({
  settings,
  resolvedTheme,
  onChange,
  onResetSection,
}: Props) {
  const patch = (next: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...next } });
  };

  return (
    <MenuEditorSection
      title="Tipografia"
      description="Fontes seguras do projeto — sem CSS arbitrário."
      actions={
        onResetSection ? (
          <button
            type="button"
            onClick={onResetSection}
            className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            Restaurar seção
          </button>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <MenuTypographyField
          label="Fonte principal"
          value={resolvedTheme.fontFamily}
          onChange={(value) => patch({ fontFamily: value })}
        />
        <MenuTypographyField
          label="Fonte dos títulos"
          value={resolvedTheme.headingFontFamily}
          onChange={(value) => patch({ headingFontFamily: value })}
        />
      </div>

      <div className="mt-6 space-y-5">
        <MenuLayoutField<MenuFontSize>
          label="Tamanho base"
          value={resolvedTheme.baseFontSize}
          onChange={(value) => patch({ baseFontSize: value })}
          options={[
            { value: "sm", label: "Pequeno" },
            { value: "md", label: "Médio" },
            { value: "lg", label: "Grande" },
          ]}
        />
        <MenuLayoutField<MenuFontWeight>
          label="Peso dos títulos"
          value={resolvedTheme.headingFontWeight}
          onChange={(value) => patch({ headingFontWeight: value })}
          columns={4}
          options={[
            { value: "medium", label: "Médio" },
            { value: "semibold", label: "Semi" },
            { value: "bold", label: "Negrito" },
            { value: "normal", label: "Normal" },
          ]}
        />
        <MenuLayoutField<MenuFontWeight>
          label="Peso do texto"
          value={resolvedTheme.bodyFontWeight}
          onChange={(value) => patch({ bodyFontWeight: value })}
          columns={2}
          options={[
            { value: "normal", label: "Normal" },
            { value: "medium", label: "Médio" },
          ]}
        />
        <MenuLayoutField<MenuHeadingScale>
          label="Escala dos títulos"
          value={resolvedTheme.headingScale}
          onChange={(value) => patch({ headingScale: value })}
          options={[
            { value: "sm", label: "Compacta" },
            { value: "md", label: "Padrão" },
            { value: "lg", label: "Expressiva" },
          ]}
        />
      </div>

      <div
        className="mt-6 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5"
        aria-label="Preview tipográfico"
        style={{ fontSize: resolvedTheme.baseFontSize === "sm" ? 14 : resolvedTheme.baseFontSize === "lg" ? 17 : 15 }}
      >
        <p
          className="text-2xl"
          style={{
            fontFamily: resolvedTheme.headingFontFamily,
            fontWeight: fontWeightCss(resolvedTheme.headingFontWeight),
            color: "#0f172a",
          }}
        >
          {settings.organizationName || "Título da loja"}
        </p>
        <p
          className="text-base"
          style={{
            fontFamily: resolvedTheme.headingFontFamily,
            fontWeight: fontWeightCss(resolvedTheme.headingFontWeight),
          }}
        >
          Nome do produto
        </p>
        <p
          className="text-sm"
          style={{
            fontFamily: resolvedTheme.fontFamily,
            fontWeight: fontWeightCss(resolvedTheme.bodyFontWeight),
            color: "#64748b",
          }}
        >
          Descrição curta do item no cardápio digital.
        </p>
        <p
          className="text-lg font-bold tabular-nums"
          style={{
            fontFamily: resolvedTheme.fontFamily,
            color: resolvedTheme.primaryColor,
          }}
        >
          R$ 24,90
        </p>
        <span
          className="inline-flex rounded-xl px-3 py-2 text-sm"
          style={{
            fontFamily: resolvedTheme.fontFamily,
            fontWeight: fontWeightCss(resolvedTheme.buttonFontWeight),
            backgroundColor: resolvedTheme.primaryColor,
            color: "#fff",
          }}
        >
          Botão
        </span>
      </div>
    </MenuEditorSection>
  );
}
