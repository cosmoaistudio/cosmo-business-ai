import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import { useDigitalMenu } from "../../hooks/useDigitalMenu";
import { useMenuTheme } from "../hooks/useMenuTheme";
import { resolveActiveTemplateId } from "../templates/resolveMenuTemplate";
import MenuEditorShell from "./editor/MenuEditorShell";

interface MenuConfiguratorProps {
  organizationId: string | null;
  settings: DigitalStoreSettings;
  savedSettings?: DigitalStoreSettings;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
  isDirty: boolean;
  saving?: boolean;
  publishing?: boolean;
  saved?: boolean;
  published?: boolean;
  saveError?: string | null;
  publishError?: string | null;
  offline?: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDiscard: () => void;
}

/**
 * Admin surface: commercial visual editor + live interactive preview.
 */
export default function MenuConfigurator({
  organizationId,
  settings,
  savedSettings,
  onChange,
  isDirty,
  saving = false,
  publishing = false,
  saved = false,
  published = false,
  saveError = null,
  publishError = null,
  offline = false,
  onSave,
  onPublish,
  onDiscard,
}: MenuConfiguratorProps) {
  const { products, loading } = useDigitalMenu(organizationId);
  const { theme, copy, features, template } = useMenuTheme(settings);

  const activeTemplateId = resolveActiveTemplateId({
    menuTemplateId: settings.menuTemplateId,
    niche: settings.niche,
  });

  return (
    <MenuEditorShell
      settings={settings}
      savedSettings={savedSettings}
      organizationId={organizationId}
      products={products}
      loading={loading}
      resolvedTheme={theme}
      resolvedCopy={copy}
      resolvedFeatures={features}
      activeTemplateId={activeTemplateId}
      templateName={template.name}
      isDirty={isDirty}
      saving={saving}
      publishing={publishing}
      saved={saved}
      published={published}
      saveError={saveError}
      publishError={publishError}
      offline={offline}
      onChange={onChange}
      onSave={onSave}
      onPublish={onPublish}
      onDiscard={onDiscard}
    />
  );
}
