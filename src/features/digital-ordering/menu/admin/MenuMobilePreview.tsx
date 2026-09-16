import { Loader2, Smartphone } from "lucide-react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import DigitalStoreHeader from "../../components/DigitalStoreHeader";
import CosmoDigitalMenu from "../components/CosmoDigitalMenu";
import { useMenuTheme } from "../hooks/useMenuTheme";

interface MenuMobilePreviewProps {
  settings: DigitalStoreSettings;
  products: DigitalMenuProduct[];
  loading?: boolean;
}

/**
 * Live preview of the public menu inside a phone-sized frame. Renders the very
 * same engine components as /menu/:slug — no parallel rendering logic — driven
 * by the unsaved draft settings so changes show up immediately.
 */
export default function MenuMobilePreview({
  settings,
  products,
  loading = false,
}: MenuMobilePreviewProps) {
  const { theme } = useMenuTheme(settings);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Smartphone className="h-4 w-4" />
        Pré-visualização do cliente
      </div>

      <div className="w-[360px] max-w-full rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
        <div className="flex justify-center py-1.5">
          <span className="h-1.5 w-20 rounded-full bg-slate-700" />
        </div>

        <div
          className="h-[620px] overflow-y-auto rounded-[1.75rem] px-3 py-4"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          <DigitalStoreHeader store={settings} />

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: theme.mutedTextColor }}
              />
            </div>
          ) : (
            <CosmoDigitalMenu
              products={products}
              loading={false}
              store={settings}
              manageSeo={false}
              onSelectProduct={() => undefined}
            />
          )}
        </div>
      </div>

      <p className="max-w-[340px] text-center text-xs text-slate-400">
        Exibindo seus produtos reais. Publique o cardápio para que os clientes
        vejam as alterações.
      </p>
    </div>
  );
}
