/**
 * @deprecated Prefer MenuEditorPanels inside MenuEditorShell.
 * Kept as a thin adapter so legacy unit tests keep working.
 */
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import type { MenuTheme, NicheCopy } from "../types/digitalMenu.types";
import { resolveMenuFeatures } from "../utils/resolveMenuPresentation";
import { getNicheConfig } from "../config/nicheConfig";
import { resolveActiveTemplateId } from "../templates/resolveMenuTemplate";
import MenuEditorPanels, { templateAppearancePatch } from "./editor/MenuEditorPanels";
import type { MenuEditorSectionId } from "./editor/menuEditor.types";

interface MenuThemeEditorProps {
  settings: DigitalStoreSettings;
  resolvedTheme: MenuTheme;
  resolvedCopy: NicheCopy;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
}

const LEGACY_SECTIONS: MenuEditorSectionId[] = [
  "identity",
  "colors",
  "layout",
  "banner",
  "products",
  "checkout",
];

export default function MenuThemeEditor({
  settings,
  resolvedTheme,
  resolvedCopy,
  onChange,
}: MenuThemeEditorProps) {
  const config = getNicheConfig(settings.niche);
  const features = resolveMenuFeatures(config, settings.menuFeatures);
  const activeTemplateId = resolveActiveTemplateId({
    menuTemplateId: settings.menuTemplateId,
    niche: settings.niche,
  });

  return (
    <div className="space-y-10">
      {LEGACY_SECTIONS.map((section) => (
        <MenuEditorPanels
          key={section}
          section={section}
          settings={settings}
          resolvedTheme={resolvedTheme}
          resolvedCopy={resolvedCopy}
          resolvedFeatures={features}
          activeTemplateId={activeTemplateId}
          onChange={onChange}
          onApplyTemplate={(id) => onChange(templateAppearancePatch(id))}
          onResetColors={() => onChange(templateAppearancePatch(activeTemplateId))}
          onResetAppearance={() => {
            const patch = templateAppearancePatch(activeTemplateId);
            onChange({ menuTheme: patch.menuTheme });
          }}
          onResetCopy={() => {
            const patch = templateAppearancePatch(activeTemplateId);
            onChange({ menuCopy: patch.menuCopy });
          }}
          onResetAll={() => onChange(templateAppearancePatch(activeTemplateId))}
        />
      ))}
    </div>
  );
}
