import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import MenuEditorPreview from "./editor/MenuEditorPreview";

interface MenuMobilePreviewProps {
  settings: DigitalStoreSettings;
  products: DigitalMenuProduct[];
  loading?: boolean;
}

/**
 * Live preview of the public menu — delegates to MenuEditorPreview.
 */
export default function MenuMobilePreview({
  settings,
  products,
  loading = false,
}: MenuMobilePreviewProps) {
  return (
    <MenuEditorPreview
      settings={settings}
      products={products}
      loading={loading}
    />
  );
}
