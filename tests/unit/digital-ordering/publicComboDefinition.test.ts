import { describe, expect, it } from "vitest";
import {
  assertPublicComboPayloadSafe,
  buildPublicComboDefinitionPayload,
  type PublicComboCatalogInput,
} from "@/features/digital-ordering/utils/publicComboDefinition";
import { validateComboFinalizeItem } from "@/features/pdv/utils/comboFinalizeContract";

const ORG = "org-public";
const OTHER = "org-other";

function baseCatalog(
  overrides?: Partial<PublicComboCatalogInput>
): PublicComboCatalogInput {
  const input: PublicComboCatalogInput = {
    storeOrganizationId: ORG,
    product: {
      id: "combo-1",
      name: "Combo Família",
      price: 49.9,
      status: "active",
      menuKind: "combo",
      imageUrl: null,
      stock: 0,
      organizationId: ORG,
    },
    slots: [
      {
        id: "slot-1",
        organizationId: ORG,
        comboProductId: "combo-1",
        componentProductId: "acai-1",
        displayName: "Açaí 1",
        quantity: 1,
        sortOrder: 0,
        allowConfiguration: true,
        active: true,
        component: {
          id: "acai-1",
          organizationId: ORG,
          name: "Açaí 500",
          price: 22,
          status: "active",
          imageUrl: null,
          menuKind: "assembled",
          stock: 10,
        },
        groups: [
          {
            id: "grp-visible",
            name: "Adicionais",
            sortOrder: 0,
            type: "optional",
            selectionType: "checkbox",
            required: false,
            minSelection: 0,
            maxSelection: 10,
            maxFree: 3,
            allowsRepeat: false,
            allowsQuantity: true,
            hidden: false,
            organizationId: ORG,
            options: [
              {
                id: "opt-visible",
                groupId: "grp-visible",
                name: "Morango",
                price: 3,
                active: true,
                stockControl: true,
                stock: 5,
                sku: "SKU-M",
                sortOrder: 0,
              },
            ],
          },
          {
            id: "grp-hidden",
            name: "Interno",
            sortOrder: 1,
            type: "optional",
            selectionType: "checkbox",
            required: false,
            minSelection: 0,
            maxSelection: 5,
            maxFree: 0,
            allowsRepeat: false,
            allowsQuantity: false,
            hidden: true,
            organizationId: ORG,
            options: [
              {
                id: "opt-hidden",
                groupId: "grp-hidden",
                name: "Segredo",
                price: 99,
                active: true,
                stockControl: false,
                stock: 1,
                sku: "SKU-H",
                sortOrder: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  return {
    ...input,
    ...overrides,
    product: overrides?.product ?? input.product,
    slots: overrides?.slots ?? input.slots,
  };
}

describe("get_public_combo_definition shape (027)", () => {
  it("1/2. hidden group e suas options não aparecem", () => {
    const payload = buildPublicComboDefinitionPayload(baseCatalog());
    const components = payload.components as Array<{
      engine_node: {
        groups: Array<{ id: string }>;
        optionsByGroupId: Record<string, Array<{ id: string }>>;
      };
    }>;
    const node = components[0].engine_node;
    expect(node.groups.map((g) => g.id)).toEqual(["grp-visible"]);
    expect(node.optionsByGroupId["grp-hidden"]).toBeUndefined();
    expect(node.optionsByGroupId["grp-visible"]?.map((o) => o.id)).toEqual([
      "opt-visible",
    ]);
    const json = JSON.stringify(payload);
    expect(json).not.toContain("opt-hidden");
    expect(json).not.toContain("grp-hidden");
  });

  it("3. filho inactive não aparece", () => {
    const catalog = baseCatalog();
    catalog.slots[0].component.status = "inactive";
    const payload = buildPublicComboDefinitionPayload(catalog);
    expect(payload.components).toEqual([]);
  });

  it("4. filho de outra organization não aparece", () => {
    const catalog = baseCatalog();
    catalog.slots[0].component.organizationId = OTHER;
    const payload = buildPublicComboDefinitionPayload(catalog);
    expect(payload.components).toEqual([]);
  });

  it("5/6/7. organization_id, sku e stock não aparecem no JSON público", () => {
    const payload = buildPublicComboDefinitionPayload(baseCatalog());
    expect(() => assertPublicComboPayloadSafe(payload)).not.toThrow();
    const json = JSON.stringify(payload);
    expect(json).not.toMatch(/"organization_id"/);
    expect(json).not.toMatch(/"sku"/);
    expect(json).not.toMatch(/"stock"/);
  });

  it("8/9. component_id e option_id continuam disponíveis", () => {
    const payload = buildPublicComboDefinitionPayload(baseCatalog());
    const components = payload.components as Array<{
      id: string;
      component_product_id: string;
      engine_node: { optionsByGroupId: Record<string, Array<{ id: string }>> };
    }>;
    expect(components[0].id).toBe("slot-1");
    expect(components[0].component_product_id).toBe("acai-1");
    expect(components[0].engine_node.optionsByGroupId["grp-visible"][0].id).toBe(
      "opt-visible"
    );
  });

  it("10. combo válido continua funcionando", () => {
    const payload = buildPublicComboDefinitionPayload(baseCatalog());
    expect((payload.product as { menu_kind: string }).menu_kind).toBe("combo");
    expect((payload.components as unknown[]).length).toBe(1);
  });
});

describe("place_public_digital_order regressão (027)", () => {
  const saleCatalog = {
    organizationId: ORG,
    products: [
      {
        id: "combo-1",
        organizationId: ORG,
        name: "Combo",
        price: 49.9,
        stock: 0,
        status: "active" as const,
        menuKind: "combo" as const,
      },
      {
        id: "acai-1",
        organizationId: ORG,
        name: "Açaí",
        price: 22,
        stock: 10,
        status: "active" as const,
        menuKind: "assembled" as const,
      },
      {
        id: "simple-1",
        organizationId: ORG,
        name: "Suco",
        price: 8,
        stock: 10,
        status: "active" as const,
        menuKind: "simple" as const,
      },
      {
        id: "assembled-1",
        organizationId: ORG,
        name: "Copo",
        price: 25,
        stock: 10,
        status: "active" as const,
        menuKind: "assembled" as const,
      },
    ],
    slots: [
      {
        id: "slot-1",
        organizationId: ORG,
        comboProductId: "combo-1",
        componentProductId: "acai-1",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
    ],
    options: [],
  };

  it("11. place_public / contrato combo válido", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 1,
        unit_price: 1,
        components: [
          { component_id: "slot-1", product_id: "acai-1", quantity: 1 },
        ],
      },
      saleCatalog
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBe(49.9);
  });

  it("12. simple continua funcionando", () => {
    const result = validateComboFinalizeItem(
      { product_id: "simple-1", quantity: 1, unit_price: 8 },
      saleCatalog
    );
    expect(result.ok).toBe(true);
  });

  it("13. assembled continua funcionando", () => {
    const result = validateComboFinalizeItem(
      { product_id: "assembled-1", quantity: 1, unit_price: 25 },
      saleCatalog
    );
    expect(result.ok).toBe(true);
  });
});
