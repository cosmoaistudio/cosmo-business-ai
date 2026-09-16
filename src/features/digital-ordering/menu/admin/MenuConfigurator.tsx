import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import { useDigitalMenu } from "../../hooks/useDigitalMenu";
import { appearanceFromNiche } from "../config/nicheConfig";
import { useMenuTheme } from "../hooks/useMenuTheme";
import MenuMobilePreview from "./MenuMobilePreview";
import MenuNicheSelector from "./MenuNicheSelector";
import MenuThemeEditor from "./MenuThemeEditor";

interface MenuConfiguratorProps {
  organizationId: string | null;
  settings: DigitalStoreSettings;
  onChange: (patch: Partial<DigitalStoreSettings>) => void;
}

/**
 * Admin surface for the Cosmo Digital Menu: niche, visual theme and a live
 * phone preview side by side.
 */
export default function MenuConfigurator({
  organizationId,
  settings,
  onChange,
}: MenuConfiguratorProps) {
  const { products, loading } = useDigitalMenu(organizationId);
  const { config, theme } = useMenuTheme(settings);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="space-y-8">
        <MenuNicheSelector
          value={settings.niche}
          onChange={(niche) => {
            const appearance = appearanceFromNiche(niche);
            onChange({
              niche: appearance.niche,
              theme: appearance.theme,
              menuTheme: appearance.menuTheme,
            });
          }}
        />

        <div className="border-t border-slate-100 pt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Aparência do cardápio
            </h2>
            <p className="text-sm text-slate-500">
              Partindo do padrão de {config.label}. Suas alterações têm
              prioridade sobre o padrão do nicho.
            </p>
          </div>

          <MenuThemeEditor
            settings={settings}
            resolvedTheme={theme}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <MenuMobilePreview
          settings={settings}
          products={products}
          loading={loading}
        />
      </div>
    </div>
  );
}
