import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type {
  MenuCatalogNavigation,
  MenuHeaderAlign,
  MenuLogoSize,
  MenuTheme,
  MenuThemeOverrides,
  NicheCopy,
  NicheFeatures,
} from "../../types/digitalMenu.types";
import type { MenuTemplateId } from "../../types/menuTemplate.types";
import { getNicheConfig } from "../../config/nicheConfig";
import { appearanceFromTemplate } from "../../templates/resolveMenuTemplate";
import MenuTemplatePicker from "../MenuTemplatePicker";
import MenuEditorBannerPanel from "./MenuEditorBannerPanel";
import {
  MenuEditorButtonsPanel,
  MenuEditorCardsPanel,
} from "./MenuEditorCardsPanel";
import MenuEditorColorsPanel from "./MenuEditorColorsPanel";
import MenuEditorLayoutPanel from "./MenuEditorLayoutPanel";
import MenuEditorSection from "./MenuEditorSection";
import MenuEditorTypographyPanel from "./MenuEditorTypographyPanel";
import MenuAssetField from "./MenuAssetField";
import MenuLayoutField from "./MenuLayoutField";
import MenuToggleField from "./MenuToggleField";
import {
  resolveEditorPanelSection,
  type MenuEditorSectionId,
} from "./menuEditor.types";

interface EditorPanelsProps {
  section: MenuEditorSectionId;
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  resolvedCopy: NicheCopy;
  resolvedFeatures: NicheFeatures;
  activeTemplateId: MenuTemplateId;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onApplyTemplate: (templateId: MenuTemplateId) => void;
  onResetColors: () => void;
  onResetAppearance: () => void;
  onResetCopy: () => void;
  onResetAll: () => void;
  onResetSection?: () => void;
  organizationId?: string | null;
  onInspectSheet?: () => void;
  onInspectCheckout?: () => void;
}

const COPY_FIELDS: Array<{ key: keyof NicheCopy; label: string }> = [
  { key: "catalogTitle", label: "Título do catálogo" },
  { key: "catalogSubtitle", label: "Subtítulo" },
  { key: "highlightsTitle", label: "Título dos destaques" },
  { key: "searchPlaceholder", label: "Placeholder da busca" },
  { key: "customizableLabel", label: "Rótulo de personalização" },
  { key: "addToCartLabel", label: "Botão adicionar" },
  { key: "viewCartLabel", label: "Botão continuar" },
  { key: "cartTitle", label: "Título do carrinho" },
  { key: "checkoutLabel", label: "Título do checkout" },
  { key: "emptyMenuMessage", label: "Mensagem de pedido vazio" },
  { key: "orderSuccessTitle", label: "Mensagem de sucesso" },
];

function fieldClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20";
}

function Label({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </span>
  );
}

export default function MenuEditorPanels({
  section,
  settings,
  resolvedTheme,
  resolvedCopy,
  resolvedFeatures,
  activeTemplateId,
  onChange,
  onApplyTemplate,
  onResetColors,
  onResetAppearance,
  onResetCopy,
  onResetAll,
  onResetSection,
  organizationId = null,
  onInspectSheet,
  onInspectCheckout,
}: EditorPanelsProps) {
  const panel = resolveEditorPanelSection(section);
  const nicheDefaults = getNicheConfig(settings.niche).copy;

  const patchMenuTheme = (patch: MenuThemeOverrides) => {
    onChange({ menuTheme: { ...(settings.menuTheme ?? {}), ...patch } });
  };

  const patchMenuCopy = (key: keyof NicheCopy, value: string) => {
    const next = { ...(settings.menuCopy ?? {}) };
    const trimmed = value.trim();
    if (!trimmed || trimmed === nicheDefaults[key]) {
      delete next[key];
    } else {
      next[key] = trimmed;
    }
    onChange({ menuCopy: next });
  };

  const patchFeature = (key: keyof NicheFeatures, value: boolean) => {
    onChange({
      menuFeatures: { ...(settings.menuFeatures ?? {}), [key]: value },
    });
  };

  if (panel === "style") {
    return (
      <MenuTemplatePicker
        value={activeTemplateId}
        onChange={onApplyTemplate}
      />
    );
  }

  if (panel === "colors") {
    return (
      <MenuEditorColorsPanel
        settings={settings}
        resolvedTheme={resolvedTheme}
        activeTemplateId={activeTemplateId}
        onChange={onChange}
        onResetColors={onResetColors}
      />
    );
  }

  if (panel === "typography") {
    return (
      <MenuEditorTypographyPanel
        settings={settings}
        resolvedTheme={resolvedTheme}
        onChange={onChange}
        onResetSection={onResetSection}
      />
    );
  }

  if (panel === "layout") {
    return (
      <MenuEditorLayoutPanel
        settings={settings}
        resolvedTheme={resolvedTheme}
        onChange={onChange}
        onResetAppearance={onResetAppearance}
      />
    );
  }

  if (panel === "banner") {
    return (
      <MenuEditorBannerPanel
        settings={settings}
        resolvedTheme={resolvedTheme}
        onChange={onChange}
        onResetSection={onResetSection}
        organizationId={organizationId}
      />
    );
  }

  if (panel === "products") {
    return (
      <>
      <MenuEditorCardsPanel
        settings={settings}
        resolvedTheme={resolvedTheme}
        resolvedFeatures={resolvedFeatures}
        onChange={onChange}
        onResetSection={onResetSection}
      />
      {onInspectSheet ? (
        <button
          type="button"
          onClick={onInspectSheet}
          className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ver ficha no preview
        </button>
      ) : null}
      </>
    );
  }

  if (panel === "buttons") {
    return (
      <MenuEditorButtonsPanel
        settings={settings}
        resolvedTheme={resolvedTheme}
        onChange={onChange}
        onResetSection={onResetSection}
      />
    );
  }

  if (panel === "identity") {
    return (
      <MenuEditorSection
        title="Identidade"
        description="Nome, mensagem e assets da marca. O preview atualiza na hora."
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
        <div className="grid gap-4">
          <label>
            <Label>Nome da loja</Label>
            <input
              value={settings.organizationName}
              onChange={(event) =>
                onChange({ organizationName: event.target.value })
              }
              className={fieldClass()}
            />
          </label>
          <label>
            <Label>Mensagem principal</Label>
            <textarea
              value={settings.welcomeMessage}
              onChange={(event) =>
                onChange({ welcomeMessage: event.target.value })
              }
              rows={2}
              className={fieldClass()}
            />
          </label>
          <label>
            <Label>Mensagem secundária</Label>
            <input
              value={settings.bannerMessage ?? ""}
              onChange={(event) =>
                onChange({ bannerMessage: event.target.value || null })
              }
              placeholder="Ex: Frete grátis acima de R$ 50"
              className={fieldClass()}
              aria-label="Mensagem promocional do banner (opcional)"
            />
          </label>
          <label>
            <Label>CTA principal</Label>
            <input
              value={settings.menuCopy?.viewCartLabel ?? ""}
              placeholder={resolvedCopy.viewCartLabel}
              onChange={(event) =>
                patchMenuCopy("viewCartLabel", event.target.value)
              }
              className={fieldClass()}
            />
          </label>

          <MenuLayoutField<MenuLogoSize>
            label="Tamanho do logo"
            value={resolvedTheme.logoSize}
            onChange={(value) => patchMenuTheme({ logoSize: value })}
            options={[
              { value: "sm", label: "Pequeno" },
              { value: "md", label: "Médio" },
              { value: "lg", label: "Grande" },
            ]}
          />
          <MenuLayoutField<MenuHeaderAlign>
            label="Alinhamento"
            value={resolvedTheme.headerAlign}
            onChange={(value) => patchMenuTheme({ headerAlign: value })}
            columns={2}
            options={[
              { value: "left", label: "Esquerda" },
              { value: "center", label: "Centro" },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MenuAssetField
              label="Logo"
              kind="logo"
              previewAlt="Logo da loja"
              organizationId={organizationId}
              value={settings.logoUrl ?? ""}
              onChange={(next) => onChange({ logoUrl: next || null })}
            />
            <MenuAssetField
              label="Banner"
              kind="banner"
              previewAlt="Capa do cardápio"
              organizationId={organizationId}
              value={settings.bannerUrl ?? ""}
              onChange={(next) => onChange({ bannerUrl: next || null })}
            />
          </div>
        </div>
      </MenuEditorSection>
    );
  }

  if (panel === "categories") {
    return (
      <MenuEditorSection
        title="Categorias"
        description="Como as categorias aparecem no cardápio."
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
        <div className="grid gap-3">
          <MenuToggleField
            label="Mostrar categorias"
            description="Navegação por grupos do cardápio."
            checked={resolvedFeatures.showCategoryTabs}
            onChange={(checked) => patchFeature("showCategoryTabs", checked)}
          />
          <MenuLayoutField
            label="Navegação do cardápio"
            value={resolvedFeatures.catalogNavigation}
            columns={2}
            onChange={(value) =>
              onChange({
                menuFeatures: {
                  ...(settings.menuFeatures ?? {}),
                  catalogNavigation: value as MenuCatalogNavigation,
                },
              })
            }
            options={[
              {
                value: "filter",
                label: "Filtrar",
                description: "A categoria esconde os demais produtos.",
              },
              {
                value: "sections",
                label: "Seções",
                description: "Rola até a categoria sem esconder o cardápio.",
              },
            ]}
          />
          <MenuToggleField
            label="Mostrar busca"
            description="Ajuda clientes a encontrar produtos mais rapidamente."
            checked={resolvedFeatures.showSearch}
            onChange={(checked) => patchFeature("showSearch", checked)}
          />
        </div>
      </MenuEditorSection>
    );
  }

  if (panel === "checkout") {
    const checkoutFields: Array<{ key: keyof NicheCopy; label: string }> = [
      { key: "checkoutLabel", label: "Título do checkout" },
      { key: "cartTitle", label: "Título do carrinho" },
      { key: "viewCartLabel", label: "Botão continuar" },
      { key: "addToCartLabel", label: "Botão adicionar" },
      { key: "customizableLabel", label: "Rótulo de personalização" },
      { key: "deliveryLabel", label: "Rótulo entrega" },
      { key: "pickupLabel", label: "Rótulo retirada" },
      { key: "paymentTitle", label: "Título pagamento" },
      { key: "orderSuccessTitle", label: "Mensagem de sucesso" },
      { key: "emptyMenuMessage", label: "Mensagem de pedido vazio" },
    ];

    return (
      <MenuEditorSection
        title="Checkout"
        description="Textos do carrinho e do checkout. Regras de negócio permanecem intactas."
        actions={
          <button
            type="button"
            onClick={onResetCopy}
            className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            Usar texto padrão do template
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {checkoutFields.map((field) => (
            <label key={field.key}>
              <Label>{field.label}</Label>
              <input
                value={settings.menuCopy?.[field.key] ?? ""}
                placeholder={resolvedCopy[field.key]}
                onChange={(event) =>
                  patchMenuCopy(field.key, event.target.value)
                }
                className={fieldClass()}
                aria-label={field.label}
              />
            </label>
          ))}
        </div>
        {onInspectCheckout ? (
          <button
            type="button"
            onClick={onInspectCheckout}
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ver checkout no preview
          </button>
        ) : null}
      </MenuEditorSection>
    );
  }

  if (panel === "advanced") {
    return (
      <MenuEditorSection
        title="Avançado"
        description="Restaure padrões do template com confirmação."
        actions={
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            Restaurar padrão
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Restaurar o template atual? Cores e textos personalizados deste modelo serão reaplicados."
                )
              ) {
                onApplyTemplate(activeTemplateId);
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Restaurar template
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Reaplica o estilo comercial selecionado.
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Restaurar aparência? Layout, densidade e estilo visual voltam ao template."
                )
              ) {
                onResetAppearance();
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Restaurar seção / aparência
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Mantém identidade e textos.
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Restaurar tudo para o template? Personalizações de cores, layout e textos serão perdidas."
                )
              ) {
                onResetAll();
              }
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm font-medium text-rose-900 hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-900/20 sm:col-span-2"
          >
            Restaurar tudo
            <span className="mt-1 block text-xs font-normal text-rose-700/80">
              Volta ao ponto de partida do template atual.
            </span>
          </button>
        </div>
      </MenuEditorSection>
    );
  }

  return (
    <MenuEditorSection
      title="Textos"
      description="Personalize a voz do cardápio. Em branco, usa o padrão do template."
      actions={
        <button
          type="button"
          onClick={onResetCopy}
          className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
        >
          Usar texto padrão do template
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {COPY_FIELDS.map((field) => (
          <label key={field.key}>
            <Label>{field.label}</Label>
            <input
              value={settings.menuCopy?.[field.key] ?? ""}
              placeholder={resolvedCopy[field.key]}
              onChange={(event) =>
                patchMenuCopy(field.key, event.target.value)
              }
              className={fieldClass()}
              aria-label={field.label}
            />
          </label>
        ))}
      </div>
    </MenuEditorSection>
  );
}

/** Shared helper for template seed — used by shell resets. */
export function templateAppearancePatch(templateId: MenuTemplateId) {
  const appearance = appearanceFromTemplate(templateId);
  return {
    menuTemplateId: appearance.templateId,
    niche: appearance.niche,
    theme: appearance.theme,
    menuTheme: appearance.menuTheme,
    menuCopy: appearance.menuCopy,
    menuFeatures: appearance.menuFeatures,
  } satisfies Partial<DigitalStoreSettings>;
}
