import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type {
  MenuBannerHeight,
  MenuBannerOverlay,
  MenuBannerStyle,
  MenuRadius,
  MenuTheme,
  MenuThemeOverrides,
} from "../../types/digitalMenu.types";
import MenuAssetField from "./MenuAssetField";
import MenuEditorSection from "./MenuEditorSection";
import MenuLayoutField from "./MenuLayoutField";

interface Props {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onResetSection?: () => void;
  organizationId?: string | null;
}

function fieldClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20";
}

export default function MenuEditorBannerPanel({
  settings,
  resolvedTheme,
  onChange,
  onResetSection,
  organizationId = null,
}: Props) {
  const patch = (next: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...next } });
  };

  return (
    <MenuEditorSection
      title="Banner"
      description="Tipo e conteúdo do topo. Overlay vem do MenuTheme."
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
      <div className="space-y-6">
        <MenuLayoutField<MenuBannerStyle>
          label="Estilo do banner"
          value={resolvedTheme.bannerStyle}
          onChange={(value) => patch({ bannerStyle: value })}
          options={[
            { value: "hidden", label: "Oculto" },
            { value: "image", label: "Imagem" },
            { value: "gradient", label: "Gradiente" },
            { value: "minimal", label: "Minimalista" },
          ]}
        />
        <MenuLayoutField<MenuBannerHeight>
          label="Altura"
          value={resolvedTheme.bannerHeight}
          onChange={(value) => patch({ bannerHeight: value })}
          options={[
            { value: "sm", label: "Compacta" },
            { value: "md", label: "Normal" },
            { value: "lg", label: "Alta" },
          ]}
        />
        <MenuLayoutField<MenuBannerOverlay>
          label="Overlay"
          value={resolvedTheme.bannerOverlay}
          onChange={(value) => patch({ bannerOverlay: value })}
          options={[
            { value: "none", label: "Nenhum" },
            { value: "soft", label: "Suave" },
            { value: "strong", label: "Forte" },
          ]}
        />
        <MenuLayoutField<MenuRadius>
          label="Radius"
          value={resolvedTheme.bannerRadius}
          onChange={(value) => patch({ bannerRadius: value })}
          options={[
            { value: "sm", label: "Suave" },
            { value: "md", label: "Médio" },
            { value: "lg", label: "Arredondado" },
          ]}
        />
        <MenuAssetField
          label="Imagem"
          kind="banner"
          previewAlt="Capa do cardápio"
          organizationId={organizationId}
          value={settings.bannerUrl ?? ""}
          onChange={(next) => onChange({ bannerUrl: next || null })}
        />
        <label>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Título / CTA do banner
          </span>
          <input
            value={settings.bannerMessage ?? ""}
            onChange={(event) =>
              onChange({ bannerMessage: event.target.value || null })
            }
            placeholder="Ex: Peça agora · Frete grátis"
            aria-label="Mensagem promocional do banner (opcional)"
            className={fieldClass()}
          />
        </label>
        <p className="text-xs text-slate-500">
          Subtítulo usa a mensagem principal da Identidade.
        </p>
      </div>
    </MenuEditorSection>
  );
}
