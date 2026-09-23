import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type {
  MenuCatalogColumns,
  MenuContentWidth,
  MenuCtaPosition,
  MenuDensity,
  MenuImageAspect,
  MenuPricePosition,
  MenuProductLayout,
  MenuRadius,
  MenuTheme,
  MenuThemeOverrides,
} from "../../types/digitalMenu.types";
import {
  resolveCtaPlacement,
  resolvePricePlacement,
} from "../../theme/cardPlacement";
import MenuEditorSection from "./MenuEditorSection";
import MenuLayoutField from "./MenuLayoutField";

interface Props {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onResetAppearance: () => void;
}

export default function MenuEditorLayoutPanel({
  settings,
  resolvedTheme,
  onChange,
  onResetAppearance,
}: Props) {
  const patch = (next: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...next } });
  };

  return (
    <MenuEditorSection
      title="Layout"
      description="Composição do catálogo — refletida no preview real."
      actions={
        <button
          type="button"
          onClick={onResetAppearance}
          className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
        >
          Restaurar seção
        </button>
      }
    >
      <div className="space-y-6">
        <MenuLayoutField<MenuContentWidth>
          label="Largura do conteúdo"
          value={resolvedTheme.contentWidth}
          onChange={(value) => patch({ contentWidth: value })}
          options={[
            { value: "narrow", label: "Estreita" },
            { value: "default", label: "Padrão" },
            { value: "wide", label: "Ampla" },
          ]}
        />
        <MenuLayoutField<MenuProductLayout>
          label="Layout dos produtos"
          value={resolvedTheme.productLayout}
          onChange={(value) => patch({ productLayout: value })}
          columns={2}
          options={[
            { value: "grid", label: "Cards", description: "Grade com foto em destaque." },
            { value: "list", label: "Lista", description: "Linha comercial: nome, descrição e preço." },
          ]}
        />
        <MenuLayoutField<MenuDensity>
          label="Densidade"
          value={resolvedTheme.density}
          onChange={(value) => patch({ density: value })}
          options={[
            { value: "compact", label: "Compacto" },
            { value: "comfortable", label: "Confortável" },
            { value: "spacious", label: "Grande" },
          ]}
        />
        <MenuLayoutField<string>
          label="Colunas"
          value={String(resolvedTheme.catalogColumns)}
          onChange={(value) =>
            patch({ catalogColumns: Number(value) as MenuCatalogColumns })
          }
          options={[
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
        />
        <MenuLayoutField<MenuImageAspect>
          label="Formato das imagens"
          value={resolvedTheme.imageAspect}
          onChange={(value) => patch({ imageAspect: value })}
          options={[
            { value: "square", label: "Quadrada" },
            { value: "portrait", label: "Retrato" },
            { value: "landscape", label: "Paisagem" },
          ]}
        />
        <MenuLayoutField<MenuRadius>
          label="Radius dos cards"
          value={resolvedTheme.cardRadius}
          onChange={(value) => patch({ cardRadius: value })}
          options={[
            { value: "sm", label: "Suave" },
            { value: "md", label: "Médio" },
            { value: "lg", label: "Arredondado" },
            { value: "xl", label: "Máximo" },
          ]}
          columns={4}
        />
        <MenuLayoutField<MenuRadius>
          label="Radius dos botões"
          value={resolvedTheme.buttonRadius}
          onChange={(value) => patch({ buttonRadius: value })}
          options={[
            { value: "sm", label: "Suave" },
            { value: "md", label: "Médio" },
            { value: "lg", label: "Arredondado" },
          ]}
        />
        <MenuLayoutField<MenuPricePosition>
          label="Posição do preço"
          value={resolvePricePlacement(resolvedTheme.pricePosition)}
          onChange={(value) => patch({ pricePosition: value })}
          options={[
            { value: "top", label: "Topo" },
            { value: "bottom", label: "Abaixo" },
            { value: "inline", label: "Inline" },
          ]}
        />
        <MenuLayoutField<MenuCtaPosition>
          label="Posição do CTA"
          value={resolveCtaPlacement(resolvedTheme.ctaPosition)}
          onChange={(value) => patch({ ctaPosition: value })}
          options={[
            { value: "bottom", label: "Abaixo" },
            { value: "inline", label: "Inline" },
            { value: "full", label: "Largura total" },
          ]}
        />
      </div>
    </MenuEditorSection>
  );
}
