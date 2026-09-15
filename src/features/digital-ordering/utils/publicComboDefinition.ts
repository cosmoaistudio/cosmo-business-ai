/**
 * Espelha as regras de filtragem/shape de get_public_combo_definition (027).
 * Fonte de verdade no SQL; este módulo permite testes unitários sem aplicar a migration.
 */

export interface PublicComboCatalogOption {
  id: string;
  groupId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  active: boolean;
  stockControl: boolean;
  stock: number;
  sku?: string | null;
  sortOrder: number;
  premium?: boolean;
  weight?: number;
}

export interface PublicComboCatalogGroup {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  type: string;
  selectionType: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  maxFree: number;
  allowsRepeat: boolean;
  allowsQuantity: boolean;
  hidden: boolean;
  organizationId: string;
  options: PublicComboCatalogOption[];
}

export interface PublicComboCatalogSlot {
  id: string;
  organizationId: string;
  comboProductId: string;
  componentProductId: string;
  displayName: string | null;
  quantity: number;
  sortOrder: number;
  allowConfiguration: boolean;
  active: boolean;
  component: {
    id: string;
    organizationId: string;
    name: string;
    price: number;
    status: "active" | "inactive";
    imageUrl?: string | null;
    menuKind: string;
    stock: number;
  };
  groups: PublicComboCatalogGroup[];
}

export interface PublicComboCatalogInput {
  storeOrganizationId: string;
  product: {
    id: string;
    name: string;
    price: number;
    status: "active" | "inactive";
    menuKind: string;
    imageUrl?: string | null;
    stock: number;
    organizationId: string;
    comboSelectionMode?: "fixed" | "choice";
    comboMinChoices?: number | null;
    comboMaxChoices?: number | null;
  };
  slots: PublicComboCatalogSlot[];
}

/** Shape pública esperada (sem stock/sku/organization_id). */
export function buildPublicComboDefinitionPayload(
  input: PublicComboCatalogInput
): Record<string, unknown> {
  if (input.product.organizationId !== input.storeOrganizationId) {
    throw new Error("Produto não encontrado");
  }
  if (input.product.menuKind !== "combo") {
    throw new Error("Produto não é combo");
  }
  if (input.product.status !== "active") {
    throw new Error("Produto inativo");
  }

  const components = input.slots
    .filter(
      (slot) =>
        slot.active &&
        slot.organizationId === input.storeOrganizationId &&
        slot.comboProductId === input.product.id &&
        slot.component.status === "active" &&
        slot.component.organizationId === input.storeOrganizationId
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((slot) => {
      const visibleGroups = slot.groups
        .filter(
          (group) =>
            !group.hidden &&
            group.organizationId === input.storeOrganizationId
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const groups = visibleGroups.map((group) => {
        const options = group.options
          .filter((option) => option.active)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return {
          id: group.id,
          name: group.name,
          description: group.description ?? null,
          sortOrder: group.sortOrder,
          type: group.type,
          selectionType: group.selectionType,
          required: group.required,
          active: true,
          minSelection: group.minSelection,
          maxSelection: group.maxSelection,
          maxFree: group.maxFree,
          allowsRepeat: group.allowsRepeat,
          allowsQuantity: group.allowsQuantity,
          hidden: false,
          optionIds: options.map((option) => option.id),
        };
      });

      const optionsByGroupId: Record<string, unknown[]> = {};
      for (const group of visibleGroups) {
        optionsByGroupId[group.id] = group.options
          .filter((option) => option.active)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((option) => ({
            id: option.id,
            groupId: option.groupId,
            name: option.name,
            description: option.description ?? null,
            imageUrl: option.imageUrl ?? null,
            price: option.price,
            stockControl: option.stockControl,
            sortOrder: option.sortOrder,
            active: option.active,
            premium: Boolean(option.premium),
            weight: Number(option.weight ?? 0),
          }));
      }

      return {
        id: slot.id,
        combo_product_id: slot.comboProductId,
        component_product_id: slot.componentProductId,
        display_name: slot.displayName,
        quantity: slot.quantity,
        sort_order: slot.sortOrder,
        allow_configuration: slot.allowConfiguration,
        active: slot.active,
        component_product: {
          id: slot.component.id,
          name: slot.component.name,
          price: slot.component.price,
          status: slot.component.status,
          image_url: slot.component.imageUrl ?? null,
          menu_kind: slot.component.menuKind,
        },
        engine_node: {
          productId: slot.component.id,
          productName: slot.component.name,
          basePrice: slot.component.price,
          status: slot.component.status,
          groups,
          optionsByGroupId,
        },
      };
    });

  return {
    product: {
      id: input.product.id,
      name: input.product.name,
      price: input.product.price,
      status: input.product.status,
      menu_kind: input.product.menuKind,
      image_url: input.product.imageUrl ?? null,
      combo_selection_mode: input.product.comboSelectionMode ?? "fixed",
      combo_min_choices: input.product.comboMinChoices ?? null,
      combo_max_choices: input.product.comboMaxChoices ?? null,
    },
    components,
  };
}

export function assertPublicComboPayloadSafe(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  if (/"organization_id"\s*:/.test(json)) {
    throw new Error("organization_id não deve aparecer no JSON público");
  }
  if (/"sku"\s*:/.test(json)) {
    throw new Error("sku não deve aparecer no JSON público");
  }
  if (/"stock"\s*:/.test(json)) {
    throw new Error("stock não deve aparecer no JSON público");
  }
}
