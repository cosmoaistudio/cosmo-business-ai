import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type {
  MenuButtonHeight,
  MenuButtonStyle,
  MenuCardStyle,
  MenuFontWeight,
  MenuImageSize,
  MenuTheme,
  MenuThemeOverrides,
  NicheFeatures,
} from "../../types/digitalMenu.types";
import { getNicheConfigForTemplate } from "../../config/nicheConfig";
import { resolveActiveTemplateId } from "../../templates/resolveMenuTemplate";
import { resolveEffectiveProductImages } from "../../utils/resolveMenuPresentation";
import MenuEditorSection from "./MenuEditorSection";
import MenuLayoutField from "./MenuLayoutField";
import MenuToggleField from "./MenuToggleField";

interface CardsProps {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  resolvedFeatures: NicheFeatures;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onResetSection?: () => void;
}

export function MenuEditorCardsPanel({
  settings,
  resolvedTheme,
  resolvedFeatures,
  onChange,
  onResetSection,
}: CardsProps) {
  const patch = (next: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...next } });
  };
  const patchFeature = (key: keyof NicheFeatures, value: boolean) => {
    onChange({
      menuFeatures: { ...(settings.menuFeatures ?? {}), [key]: value },
    });
  };

  const templateConfig = getNicheConfigForTemplate(
    settings.niche,
    resolveActiveTemplateId({
      menuTemplateId: settings.menuTemplateId,
      niche: settings.niche,
    })
  );
  const productImages = resolveEffectiveProductImages(
    templateConfig,
    settings.menuTheme,
    settings.menuFeatures
  );

  return (
    <MenuEditorSection
      title="Produtos"
      description="Estilo dos cards — sem alterar o modelo de produtos."
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
        <MenuLayoutField<MenuCardStyle>
          label="Estilo do card"
          value={resolvedTheme.cardStyle}
          onChange={(value) => patch({ cardStyle: value })}
          options={[
            { value: "elevated", label: "Elevado" },
            { value: "flat", label: "Flat" },
            { value: "bordered", label: "Borda" },
          ]}
        />
        <MenuLayoutField<MenuImageSize>
          label="Tamanho da imagem"
          value={resolvedTheme.imageSize}
          onChange={(value) => patch({ imageSize: value })}
          options={[
            { value: "compact", label: "Compacta" },
            { value: "medium", label: "Média" },
            { value: "large", label: "Grande" },
          ]}
        />
        <div className="grid gap-3">
          <MenuToggleField
            label="Exibir imagens"
            description={
              productImages.allowed
                ? "Na lista, a foto fica secundária. Sem foto, o texto ocupa a linha."
                : "Este template não permite imagens."
            }
            checked={productImages.enabled}
            disabled={!productImages.allowed}
            onChange={(checked) => patch({ showProductImages: checked })}
          />
          <MenuToggleField
            label="Mostrar descrição"
            description="No card, até duas linhas. A ficha continua completa."
            checked={resolvedFeatures.showDescriptions}
            onChange={(checked) => patchFeature("showDescriptions", checked)}
          />
          <MenuToggleField
            label="Mostrar badge"
            checked={resolvedFeatures.showPopularBadge}
            onChange={(checked) => patchFeature("showPopularBadge", checked)}
          />
          <MenuToggleField
            label="Mostrar destaques"
            checked={resolvedFeatures.showHighlights}
            onChange={(checked) => patchFeature("showHighlights", checked)}
          />
          <MenuToggleField
            label="Mostrar promoções"
            checked={resolvedFeatures.showPromotions}
            onChange={(checked) => patchFeature("showPromotions", checked)}
          />
        </div>
      </div>
    </MenuEditorSection>
  );
}

interface ButtonsProps {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onResetSection?: () => void;
}

export function MenuEditorButtonsPanel({
  settings,
  resolvedTheme,
  onChange,
  onResetSection,
}: ButtonsProps) {
  const patch = (next: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...next } });
  };

  return (
    <MenuEditorSection
      title="Botões"
      description="Mesmo sistema visual no catálogo, product sheet, carrinho e checkout."
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
        <MenuLayoutField<MenuButtonStyle>
          label="Estilo"
          value={resolvedTheme.buttonStyle}
          onChange={(value) => patch({ buttonStyle: value })}
          options={[
            { value: "solid", label: "Sólido" },
            { value: "outline", label: "Outline" },
            { value: "soft", label: "Suave" },
          ]}
        />
        <MenuLayoutField<MenuButtonHeight>
          label="Altura"
          value={resolvedTheme.buttonHeight}
          onChange={(value) => patch({ buttonHeight: value })}
          options={[
            { value: "sm", label: "Baixa" },
            { value: "md", label: "Média" },
            { value: "lg", label: "Alta" },
          ]}
        />
        <MenuLayoutField<MenuFontWeight>
          label="Peso"
          value={resolvedTheme.buttonFontWeight}
          onChange={(value) => patch({ buttonFontWeight: value })}
          options={[
            { value: "medium", label: "Médio" },
            { value: "semibold", label: "Semi" },
            { value: "bold", label: "Negrito" },
          ]}
        />
        <MenuToggleField
          label="Sombra no botão"
          checked={resolvedTheme.buttonShadow}
          onChange={(checked) => patch({ buttonShadow: checked })}
        />
      </div>
    </MenuEditorSection>
  );
}
