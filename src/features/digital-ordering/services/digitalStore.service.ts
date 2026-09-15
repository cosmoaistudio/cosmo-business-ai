import { productEngine } from "@/features/product-engine";
import {
  toDigitalMenuProduct,
  type DigitalMenuComboSlot,
  type DigitalMenuProduct,
} from "@/features/product-engine/integrations/digitalMenu.adapter";
import { listComboComponents } from "@/features/product-composition/repository/comboComponents.repository";
import { getProductById } from "@/features/products/repository/products.repository";
import type { ProductMenuKind } from "@/features/products/types/product";
import {
  fetchDigitalStoreBySlug,
  fetchDigitalStoreSettings,
  fetchDigitalStoreTables,
  fetchPaymentSettingsFromStore,
  fetchPublicMenuBySlug,
  resolveOrganizationIdBySlug,
  saveCatalogSnapshotToStore,
  upsertDigitalStoreSettings,
  upsertDigitalStoreTables,
} from "../repository/digitalStore.repository";
import type {
  DigitalQrCodeEntry,
  DigitalStoreSettings,
  DigitalStoreTable,
} from "../types/digitalStore.types";
import type { DigitalPaymentSettings } from "../types/digitalPayment.types";
import { loadCatalogSnapshot, saveCatalogSnapshot } from "../utils/catalogSnapshot";
import { buildDigitalOrderingUrl } from "../utils/qrCodeUrls";
import { normalizeStoreSlug } from "../utils/storeSlug";

async function buildDigitalMenuProducts(): Promise<DigitalMenuProduct[]> {
  const nodes = await productEngine.loadCatalog();
  const products: DigitalMenuProduct[] = [];

  for (const node of nodes) {
    let menuKind: ProductMenuKind =
      node.groups.length > 0 ? "assembled" : "simple";
    let imageUrl: string | null = null;
    let comboSlots: DigitalMenuComboSlot[] | undefined;

    try {
      const product = await getProductById(node.productId);
      imageUrl = product.image_url ?? null;
      if (product.menu_kind === "combo") {
        menuKind = "combo";
        const slots = (await listComboComponents(node.productId)).filter(
          (row) => row.active
        );
        comboSlots = slots.map((slot) => {
          const childNode = nodes.find(
            (entry) => entry.productId === slot.component_product_id
          );
          const maxFreeHint = Math.max(
            0,
            ...(childNode?.groups.map((group) => group.maxFree) ?? [0])
          );
          return {
            id: slot.id,
            componentProductId: slot.component_product_id,
            displayName:
              slot.display_name?.trim() ||
              slot.component_product?.name ||
              "Componente",
            quantity: slot.quantity,
            allowConfiguration: slot.allow_configuration,
            active: slot.active,
            maxFreeHint,
          };
        });
      } else if (product.menu_kind === "simple" || product.menu_kind === "assembled") {
        menuKind = product.menu_kind;
      }
    } catch {
      // Sem menu_kind / slots — fallback assembled/simple pelo node
    }

    products.push(
      toDigitalMenuProduct(node, { menuKind, imageUrl, comboSlots })
    );
  }

  return products;
}

export const digitalStoreService = {
  async loadSettings(organizationId: string, organizationName: string) {
    return fetchDigitalStoreSettings(organizationId, organizationName);
  },

  async saveSettings(
    settings: DigitalStoreSettings,
    paymentSettings?: DigitalPaymentSettings,
    qrCodes: DigitalQrCodeEntry[] = [],
    catalogSnapshot: DigitalMenuProduct[] = []
  ) {
    const payment =
      paymentSettings ?? (await fetchPaymentSettingsFromStore(settings.organizationId));
    const codes =
      qrCodes.length > 0
        ? qrCodes
        : this.buildQrCodes(settings, await fetchDigitalStoreTables(settings.organizationId));

    return upsertDigitalStoreSettings(settings, payment, codes, catalogSnapshot);
  },

  async resolveBySlug(slug: string) {
    return fetchDigitalStoreBySlug(normalizeStoreSlug(slug));
  },

  async resolveOrganizationId(slug: string) {
    return resolveOrganizationIdBySlug(normalizeStoreSlug(slug));
  },

  async loadTables(organizationId: string) {
    return fetchDigitalStoreTables(organizationId);
  },

  async saveTables(organizationId: string, tables: DigitalStoreTable[]) {
    return upsertDigitalStoreTables(organizationId, tables);
  },

  async loadPaymentSettings(organizationId: string) {
    return fetchPaymentSettingsFromStore(organizationId);
  },

  async publishCatalog(organizationId: string) {
    const nodes = await productEngine.loadCatalog();
    const products = await buildDigitalMenuProducts();
    saveCatalogSnapshot(organizationId, nodes);
    await saveCatalogSnapshotToStore(organizationId, products);
    return products;
  },

  async loadMenuProducts(
    organizationId: string,
    storeSlug?: string | null
  ): Promise<DigitalMenuProduct[]> {
    if (storeSlug) {
      const publicMenu = await fetchPublicMenuBySlug(storeSlug);
      if (publicMenu.length > 0) return publicMenu;
    }

    try {
      const products = await buildDigitalMenuProducts();
      if (products.length > 0) {
        const nodes = await productEngine.loadCatalog();
        saveCatalogSnapshot(organizationId, nodes);
        return products;
      }
    } catch {
      // RLS ou sessão indisponível — usa snapshot local ou publicado
    }

    if (storeSlug) {
      return fetchPublicMenuBySlug(storeSlug);
    }

    return loadCatalogSnapshot(organizationId);
  },

  buildQrCodes(settings: DigitalStoreSettings, tables: DigitalStoreTable[]): DigitalQrCodeEntry[] {
    const slug = settings.slug;
    const entries: DigitalQrCodeEntry[] = [
      {
        type: "pickup",
        label: "Retirada",
        url: buildDigitalOrderingUrl({ slug, type: "pickup" }),
      },
      {
        type: "delivery",
        label: "Delivery",
        url: buildDigitalOrderingUrl({ slug, type: "delivery" }),
      },
      {
        type: "event",
        label: "Evento",
        url: buildDigitalOrderingUrl({ slug, type: "event" }),
      },
    ];

    for (const table of tables) {
      entries.push({
        type: "table",
        label: table.label,
        tableId: table.id,
        url: buildDigitalOrderingUrl({ slug, type: "table", tableId: table.id }),
      });
    }

    return entries;
  },
};
