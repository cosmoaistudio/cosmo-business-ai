import { productEngine } from "@/features/product-engine";
import {
  toDigitalMenuProduct,
  type DigitalMenuComboSlot,
  type DigitalMenuProduct,
} from "@/features/product-engine/integrations/digitalMenu.adapter";
import { listComboComponents } from "@/features/product-composition/repository/comboComponents.repository";
import { getProducts } from "@/features/products/repository/products.repository";
import type { Product } from "@/features/products/types/product";
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
import { loadCatalogSnapshot, saveDigitalMenuSnapshot } from "../utils/catalogSnapshot";
import { digitalMenuExtrasFromProduct } from "../utils/digitalMenuProductExtras";
import { buildDigitalOrderingUrl } from "../utils/qrCodeUrls";
import { normalizeStoreSlug } from "../utils/storeSlug";

/**
 * Builds the publishable Digital Menu snapshot from the in-app catalog
 * (product-engine nodes + products list). Does not call getProductById.
 */
async function buildDigitalMenuProducts(): Promise<DigitalMenuProduct[]> {
  const [nodes, catalogProducts] = await Promise.all([
    productEngine.loadCatalog(),
    getProducts(),
  ]);
  const productsById = new Map<string, Product>(
    catalogProducts.map((product) => [product.id, product])
  );
  const products: DigitalMenuProduct[] = [];

  for (const node of nodes) {
    let extras: ReturnType<typeof digitalMenuExtrasFromProduct> = {
      menuKind: node.groups.length > 0 ? "assembled" : "simple",
    };
    let comboSlots: DigitalMenuComboSlot[] | undefined;

    const product = productsById.get(node.productId);
    if (product) {
      extras = digitalMenuExtrasFromProduct(product);

      if (product.menu_kind === "combo") {
        extras.menuKind = "combo";
        try {
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
        } catch {
          comboSlots = undefined;
        }
      }
    }

    products.push(
      toDigitalMenuProduct(node, {
        ...extras,
        comboSlots,
      })
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
    /** Omit to keep the currently published catalog untouched. */
    catalogSnapshot?: DigitalMenuProduct[]
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

  /**
   * Publishes onto the org store whose slug matches `expectedSlug`
   * (same identity as /menu/:slug). Returns only the persisted snapshot.
   */
  async publishCatalog(organizationId: string, expectedSlug: string) {
    const products = await buildDigitalMenuProducts();
    if (products.length === 0) {
      throw new Error(
        "Nenhum produto disponível para publicar. Cadastre produtos ativos antes de publicar o cardápio."
      );
    }

    const slug = normalizeStoreSlug(expectedSlug);
    if (!slug) {
      throw new Error(
        "Slug da loja inválido. Defina o slug em Pedido Digital antes de publicar."
      );
    }

    saveDigitalMenuSnapshot(organizationId, products);
    const persisted = await saveCatalogSnapshotToStore(
      organizationId,
      products,
      slug
    );
    return persisted;
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
        saveDigitalMenuSnapshot(organizationId, products);
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
        // Main public menu — the QR a merchant puts on counters and flyers.
        type: "menu",
        label: "Cardápio",
        url: buildDigitalOrderingUrl({ slug, type: "menu" }),
      },
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
