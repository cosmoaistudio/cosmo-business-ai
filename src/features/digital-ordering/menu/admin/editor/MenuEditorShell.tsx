import { useCallback, useEffect, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type { MenuTheme, NicheCopy, NicheFeatures } from "../../types/digitalMenu.types";
import type { MenuTemplateId } from "../../types/menuTemplate.types";
import { appearanceFromTemplate } from "../../templates/resolveMenuTemplate";
import { getMenuTemplate } from "../../templates/menuTemplateRegistry";
import MenuEditorPanels, { templateAppearancePatch } from "./MenuEditorPanels";
import MenuEditorPreview from "./MenuEditorPreview";
import MenuEditorSidebar from "./MenuEditorSidebar";
import MenuPublishBar from "./MenuPublishBar";
import MenuPublishSummary from "./MenuPublishSummary";
import MenuRestoreActions from "./MenuRestoreActions";
import MenuTemplateSwitchConfirm from "./MenuTemplateSwitchConfirm";
import MenuUnsavedChanges from "./MenuUnsavedChanges";
import { previewTargetForSection, sectionForPreviewTarget } from "./previewSelectMap";
import {
  hasVisualCustomization,
  resetSectionPatch,
  sectionHasDraftChanges,
  sectionSnapshot,
} from "./resetEditorSection";
import { useEditorHistory } from "./useEditorHistory";
import type {
  MenuEditorNavId,
  MenuEditorSectionId,
  MenuEditorViewport,
  MenuEditorZoom,
  MenuPreviewInteraction,
  MenuPreviewSelectable,
} from "./menuEditor.types";
import { MENU_EDITOR_NAV_GROUPS } from "./menuEditor.types";

interface MenuEditorShellProps {
  settings: DigitalStoreSettings;
  savedSettings?: DigitalStoreSettings;
  organizationId?: string | null;
  products: DigitalMenuProduct[];
  loading?: boolean;
  resolvedTheme: MenuTheme;
  resolvedCopy: NicheCopy;
  resolvedFeatures: NicheFeatures;
  activeTemplateId: MenuTemplateId;
  templateName: string;
  isDirty: boolean;
  saving?: boolean;
  publishing?: boolean;
  saved?: boolean;
  published?: boolean;
  saveError?: string | null;
  publishError?: string | null;
  offline?: boolean;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  onSave: () => void;
  onPublish: () => void;
  onDiscard: () => void;
}

export default function MenuEditorShell({
  settings,
  savedSettings,
  organizationId = null,
  products,
  loading = false,
  resolvedTheme,
  resolvedCopy,
  resolvedFeatures,
  activeTemplateId,
  templateName,
  isDirty,
  saving = false,
  publishing = false,
  saved = false,
  published = false,
  saveError = null,
  publishError = null,
  offline = false,
  onChange,
  onSave,
  onPublish,
  onDiscard,
}: MenuEditorShellProps) {
  const [section, setSection] = useState<MenuEditorSectionId>("identity");
  const [activeNav, setActiveNav] = useState<MenuEditorNavId>("identity");
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] =
    useState<MenuTemplateId | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [viewport, setViewport] = useState<MenuEditorViewport>("mobile");
  const [zoom, setZoom] = useState<MenuEditorZoom>(75);
  const [interaction, setInteraction] =
    useState<MenuPreviewInteraction>("edit");
  const [selectedTarget, setSelectedTarget] =
    useState<MenuPreviewSelectable | null>("header");

  const { pushAndPatch, undo, clear, canUndo } = useEditorHistory(
    settings,
    onChange
  );
  const persisted = savedSettings ?? settings;

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const applyTemplate = useCallback(
    (templateId: MenuTemplateId) => {
      pushAndPatch(templateAppearancePatch(templateId), { section: "style" });
    },
    [pushAndPatch]
  );

  const requestApplyTemplate = useCallback(
    (templateId: MenuTemplateId) => {
      if (templateId === activeTemplateId) return;
      if (hasVisualCustomization(settings, activeTemplateId)) {
        setPendingTemplateId(templateId);
        return;
      }
      applyTemplate(templateId);
    },
    [activeTemplateId, applyTemplate, settings]
  );

  const resetColors = useCallback(() => {
    if (
      !window.confirm(
        "Restaurar cores do template? Suas cores personalizadas serão substituídas."
      )
    ) {
      return;
    }
    pushAndPatch(resetSectionPatch("colors", activeTemplateId, settings), {
      section: "colors",
    });
  }, [activeTemplateId, pushAndPatch, settings]);

  const resetAppearance = useCallback(() => {
    pushAndPatch(resetSectionPatch("layout", activeTemplateId, settings), {
      section: "layout",
    });
  }, [activeTemplateId, pushAndPatch, settings]);

  const resetCopy = useCallback(() => {
    if (
      !window.confirm(
        "Usar texto padrão do template? Textos personalizados serão removidos."
      )
    ) {
      return;
    }
    const appearance = appearanceFromTemplate(activeTemplateId);
    pushAndPatch({ menuCopy: appearance.menuCopy }, { section: "checkout" });
  }, [activeTemplateId, pushAndPatch]);

  const resetAll = useCallback(() => {
    pushAndPatch(templateAppearancePatch(activeTemplateId), { section: "advanced" });
  }, [activeTemplateId, pushAndPatch]);

  const resetCurrentSection = useCallback(() => {
    if (
      !window.confirm(
        "Restaurar esta seção para o template? As outras personalizações permanecem."
      )
    ) {
      return;
    }
    pushAndPatch(resetSectionPatch(section, activeTemplateId, settings), {
      section,
    });
  }, [activeTemplateId, pushAndPatch, section, settings]);

  const restoreSavedSection = useCallback(() => {
    pushAndPatch(sectionSnapshot(section, persisted), { section });
  }, [persisted, pushAndPatch, section]);

  const requestDiscard = () => {
    if (!isDirty) return;
    setPendingDiscard(true);
    setUnsavedOpen(true);
  };

  const handleSelectTarget = (target: MenuPreviewSelectable) => {
    setSelectedTarget(target);
    const nextSection = sectionForPreviewTarget(target);
    setSection(nextSection);
    const match = MENU_EDITOR_NAV_GROUPS.flatMap((group) => group.items).find(
      (item) => item.preview === target
    );
    setActiveNav(
      match?.navId ??
        MENU_EDITOR_NAV_GROUPS.flatMap((group) => group.items).find(
          (item) => item.section === nextSection
        )?.navId ??
        "identity"
    );
  };

  const handleNav = (
    next: MenuEditorSectionId,
    preview: MenuPreviewSelectable | null,
    navId: MenuEditorNavId
  ) => {
    setSection(next);
    setActiveNav(navId);
    setSelectedTarget(preview ?? previewTargetForSection(next));
  };

  const inspect: "productsheet" | "checkout" | null =
    selectedTarget === "checkout" || section === "checkout"
      ? "checkout"
      : selectedTarget === "productsheet"
        ? "productsheet"
        : null;

  const dirtyNavIds = useMemo(() => {
    return MENU_EDITOR_NAV_GROUPS.flatMap((group) => group.items)
      .filter((item) => sectionHasDraftChanges(item.section, settings, persisted))
      .map((item) => item.navId);
  }, [persisted, settings]);

  const propertiesPanel = (
    <div className="space-y-4">
      <MenuRestoreActions
        onResetSection={resetCurrentSection}
        onRestoreSaved={restoreSavedSection}
        onUndo={() => undo()}
        canUndo={canUndo}
      />
      <MenuEditorPanels
        section={section}
        settings={settings}
        resolvedTheme={resolvedTheme}
        resolvedCopy={resolvedCopy}
        resolvedFeatures={resolvedFeatures}
        activeTemplateId={activeTemplateId}
        organizationId={organizationId}
        onChange={pushAndPatch}
        onApplyTemplate={requestApplyTemplate}
        onResetColors={resetColors}
        onResetAppearance={resetAppearance}
        onResetCopy={resetCopy}
        onResetAll={resetAll}
        onResetSection={resetCurrentSection}
        onInspectSheet={() => handleSelectTarget("productsheet")}
        onInspectCheckout={() => handleSelectTarget("checkout")}
      />
    </div>
  );

  const previewProps = {
    settings,
    products,
    loading,
    viewport,
    onViewportChange: setViewport,
    zoom,
    onZoomChange: setZoom,
    selectedTarget,
    onSelectTarget: handleSelectTarget,
    interaction,
    onInteractionChange: setInteraction,
    previewInspect: inspect,
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Cosmo Menu Builder
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Personalize seu cardápio
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {templateName ? (
              <>
                Modelo atual:{" "}
                <span className="font-medium text-slate-700">{templateName}</span>
                .
              </>
            ) : (
              "Crie uma experiência que combine com sua marca."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => undo()}
            disabled={!canUndo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 motion-reduce:transition-none"
          >
            <Undo2 className="h-4 w-4" aria-hidden />
            Desfazer
          </button>
          <MenuPublishBar
            isDirty={isDirty}
            saving={saving}
            publishing={publishing}
            saved={saved}
            published={published}
            error={saveError}
            publishError={publishError}
            offline={offline}
            onSave={onSave}
            onPublish={() => setPublishOpen(true)}
            onDiscard={requestDiscard}
            onPreview={() => setInteraction("view")}
          />
        </div>
      </header>

      <div className="grid xl:grid-cols-[220px_minmax(0,1.35fr)_minmax(300px,380px)]">
        <aside className="border-b border-slate-100 px-3 py-4 xl:border-b-0 xl:border-r xl:px-4 xl:py-5">
          <MenuEditorSidebar
            active={section}
            activeNav={activeNav}
            dirtyNavIds={dirtyNavIds}
            onChange={handleNav}
          />
        </aside>

        <div className="min-w-0 border-r border-slate-100 bg-slate-50/60 px-3 py-4 sm:px-4 sm:py-5">
          <div className="sticky top-4">
            <MenuEditorPreview {...previewProps} prominent />
          </div>
        </div>

        <div
          id="menu-editor-properties"
          className="min-w-0 space-y-4 px-5 py-5 sm:px-6"
        >
          {selectedTarget ? (
            <p className="text-xs font-medium text-slate-500">
              Selecionado no preview:{" "}
              <span className="text-slate-800">{selectedTarget}</span>
            </p>
          ) : null}
          {propertiesPanel}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-slate-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur xl:hidden">
        <button
          type="button"
          onClick={() => {
            document.getElementById("menu-editor-properties")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
        >
          Propriedades
        </button>
      </div>

      <MenuUnsavedChanges
        open={unsavedOpen}
        onContinue={() => {
          setUnsavedOpen(false);
          setPendingDiscard(false);
        }}
        onDiscard={() => {
          setUnsavedOpen(false);
          if (pendingDiscard) {
            clear();
            onDiscard();
          }
          setPendingDiscard(false);
        }}
        onSave={() => {
          setUnsavedOpen(false);
          setPendingDiscard(false);
          onSave();
        }}
      />

      <MenuTemplateSwitchConfirm
        open={pendingTemplateId != null}
        templateName={
          pendingTemplateId ? getMenuTemplate(pendingTemplateId).name : ""
        }
        onCancel={() => setPendingTemplateId(null)}
        onContinue={() => {
          if (pendingTemplateId) applyTemplate(pendingTemplateId);
          setPendingTemplateId(null);
        }}
      />

      <MenuPublishSummary
        open={publishOpen}
        settings={settings}
        theme={resolvedTheme}
        templateName={templateName}
        templateId={activeTemplateId}
        onCancel={() => setPublishOpen(false)}
        onConfirm={() => {
          setPublishOpen(false);
          onPublish();
        }}
      />
    </div>
  );
}
