/**
 * Contrato unificado combo fixed|choice (espelha migration 028).
 * Unidade = 1 sale_item filho com options próprias.
 */

export type MenuKind = "simple" | "assembled" | "combo";
export type ComboSelectionMode = "fixed" | "choice";

export interface ContractSlot {
  id: string;
  organizationId: string;
  comboProductId: string;
  componentProductId: string;
  quantity: number;
  allowConfiguration: boolean;
  active: boolean;
  displayName?: string | null;
}

export interface ContractProduct {
  id: string;
  organizationId: string;
  name: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
  menuKind: MenuKind;
  comboSelectionMode?: ComboSelectionMode;
  comboMinChoices?: number | null;
  comboMaxChoices?: number | null;
}

export interface ContractOption {
  id: string;
  organizationId: string;
  productId: string;
  groupId: string;
  name: string;
  price: number;
  active: boolean;
  stockControl: boolean;
  stock: number;
  maxFree: number;
  maxSelection: number;
  groupType: "optional" | "required" | "gift";
}

export interface ContractComponentPayload {
  component_id?: string | null;
  product_id: string;
  quantity?: number | null;
  unit_index?: number | null;
  label?: string | null;
  options?: Array<{ option_id: string; quantity?: number }>;
}

export interface ContractItemPayload {
  product_id: string;
  quantity: number;
  unit_price?: number;
  options?: Array<{ option_id: string; quantity?: number }>;
  components?: ContractComponentPayload[];
}

export interface ContractCatalog {
  organizationId: string;
  products: ContractProduct[];
  slots: ContractSlot[];
  options: ContractOption[];
}

export interface ResolvedComboUnit {
  componentId: string;
  productId: string;
  productName: string;
  unitIndex: number;
  label: string;
  childQtyPerCombo: number;
  allowConfiguration: boolean;
  options: Array<{ option_id: string; quantity: number }>;
  paidAddons: number;
}

export type ContractResult =
  | {
      ok: true;
      unitPrice: number;
      lineSubtotal: number;
      stockMoves: Array<{
        kind: "product" | "option";
        id: string;
        quantity: number;
      }>;
      units: ResolvedComboUnit[];
    }
  | { ok: false; error: string };

function paidAddonsForOptions(
  productId: string,
  optionsPayload: Array<{ option_id: string; quantity?: number }>,
  catalog: ContractCatalog
): number | { error: string } {
  const unitsByGroup = new Map<
    string,
    Array<{ price: number; optionId: string; meta: ContractOption }>
  >();

  for (const entry of optionsPayload) {
    const qty = entry.quantity ?? 1;
    if (!entry.option_id || qty <= 0) {
      return { error: `Opção inválida no produto ${productId}` };
    }
    const opt = catalog.options.find(
      (o) =>
        o.id === entry.option_id && o.organizationId === catalog.organizationId
    );
    if (!opt) return { error: `Opção não encontrada: ${entry.option_id}` };
    if (!opt.active) return { error: `Opção inativa: ${opt.name}` };
    if (opt.productId !== productId) {
      return { error: `Opção ${opt.name} não pertence ao produto ${productId}` };
    }
    const list = unitsByGroup.get(opt.groupId) ?? [];
    for (let i = 0; i < qty; i += 1) {
      list.push({ price: opt.price, optionId: opt.id, meta: opt });
    }
    unitsByGroup.set(opt.groupId, list);
  }

  let paid = 0;
  for (const [groupId, units] of unitsByGroup) {
    const sample = units[0]?.meta;
    if (!sample) continue;
    if (units.length > sample.maxSelection) {
      return {
        error: `Grupo ${groupId} permite no máximo ${sample.maxSelection} seleção(ões)`,
      };
    }
    if (
      sample.groupType === "gift" &&
      sample.maxFree > 0 &&
      units.length > sample.maxFree
    ) {
      return {
        error: `Brindes limitados a ${sample.maxFree} item(ns)`,
      };
    }
    const ordered = [...units].sort(
      (a, b) => a.price - b.price || a.optionId.localeCompare(b.optionId)
    );
    let freeLeft = Math.max(sample.maxFree, 0);
    for (const unit of ordered) {
      if (freeLeft > 0) freeLeft -= 1;
      else paid += unit.price;
    }
  }
  return paid;
}

function normalizeOptions(
  options?: Array<{ option_id: string; quantity?: number }>
): Array<{ option_id: string; quantity: number }> {
  return (options ?? []).map((entry) => ({
    option_id: entry.option_id,
    quantity: entry.quantity ?? 1,
  }));
}

/**
 * Texto KDS/impressão por unidades (espelha build_kitchen_item_summary 028).
 * Formato: COPO {n} — {nome real do produto assembled}
 * Nunca usa label "Copo 1" como nome principal.
 */
export function buildComboKitchenSummary(units: ResolvedComboUnit[]): string {
  return units
    .slice()
    .sort((a, b) => a.unitIndex - b.unitIndex)
    .map((unit) => {
      const productTitle = unit.productName.trim() || unit.label;
      const header = `COPO ${unit.unitIndex} — ${productTitle}`;
      const optionLines = unit.options.flatMap((opt) => {
        const name = opt.option_id;
        const qty = opt.quantity;
        return qty > 1 ? [`+ ${qty}x ${name}`] : [`+ ${name}`];
      });
      return [header, ...optionLines].join("\n");
    })
    .join("\n");
}

export function buildComboKitchenSummaryNamed(
  units: Array<
    ResolvedComboUnit & { optionNames?: Record<string, string> }
  >
): string {
  return units
    .slice()
    .sort((a, b) => a.unitIndex - b.unitIndex)
    .map((unit) => {
      const productTitle = unit.productName.trim() || unit.label;
      const header = `COPO ${unit.unitIndex} — ${productTitle}`;
      const optionLines = unit.options.map((opt) => {
        const name = unit.optionNames?.[opt.option_id] ?? opt.option_id;
        return opt.quantity > 1 ? `+ ${opt.quantity}x ${name}` : `+ ${name}`;
      });
      return [header, ...optionLines].join("\n");
    })
    .join("\n");
}

function resolveFixedUnits(
  product: ContractProduct,
  components: ContractComponentPayload[],
  catalog: ContractCatalog,
  comboQty: number
): ContractResult {
  const activeSlots = catalog.slots.filter(
    (s) =>
      s.comboProductId === product.id &&
      s.organizationId === catalog.organizationId &&
      s.active
  );

  if (activeSlots.length === 0) {
    return { ok: false, error: `Combo ${product.name} sem componentes ativos` };
  }
  if (components.length !== activeSlots.length) {
    return {
      ok: false,
      error: `Combo ${product.name} exige todos os ${activeSlots.length} componentes ativos (recebido: ${components.length})`,
    };
  }

  let addons = 0;
  const seen = new Set<string>();
  const stockMoves: Array<{
    kind: "product" | "option";
    id: string;
    quantity: number;
  }> = [];
  const units: ResolvedComboUnit[] = [];

  for (let index = 0; index < components.length; index += 1) {
    const component = components[index];
    const componentId = component.component_id?.trim() || null;
    if (!componentId) {
      return {
        ok: false,
        error: `component_id obrigatório no combo ${product.name}`,
      };
    }

    const slot = catalog.slots.find((s) => s.id === componentId);
    if (!slot) {
      return { ok: false, error: `component_id inválido: ${componentId}` };
    }
    if (slot.organizationId !== catalog.organizationId) {
      return { ok: false, error: "Componente de outra organização" };
    }
    if (slot.comboProductId !== product.id) {
      return {
        ok: false,
        error: `component_id ${componentId} não pertence ao combo ${product.name}`,
      };
    }
    if (!slot.active) {
      return {
        ok: false,
        error: `Componente inativo no combo ${product.name}`,
      };
    }
    if (component.product_id !== slot.componentProductId) {
      return {
        ok: false,
        error: `product_id do componente não confere com o slot ${componentId}`,
      };
    }
    if (seen.has(componentId)) {
      return {
        ok: false,
        error: `Componente duplicado no payload: ${componentId}`,
      };
    }
    seen.add(componentId);

    if (component.quantity != null && component.quantity !== slot.quantity) {
      return {
        ok: false,
        error: `Quantidade inválida no slot ${componentId} (esperado ${slot.quantity})`,
      };
    }

    const child = catalog.products.find(
      (p) =>
        p.id === slot.componentProductId &&
        p.organizationId === catalog.organizationId
    );
    if (!child) {
      return {
        ok: false,
        error: `Componente não encontrado: ${slot.componentProductId}`,
      };
    }
    if (child.status !== "active") {
      return { ok: false, error: `Componente inativo: ${child.name}` };
    }
    if (child.menuKind === "combo") {
      return { ok: false, error: `Componente não pode ser combo: ${child.name}` };
    }

    const effectiveQty = slot.quantity * comboQty;
    if (child.stock < effectiveQty) {
      return {
        ok: false,
        error: `Estoque insuficiente para componente: ${child.name} (disponível: ${child.stock})`,
      };
    }

    stockMoves.push({
      kind: "product",
      id: child.id,
      quantity: effectiveQty,
    });

    const options = normalizeOptions(component.options);
    let paid = 0;
    if (!slot.allowConfiguration) {
      if (options.length > 0) {
        return {
          ok: false,
          error: `Slot ${componentId} não permite options (allow_configuration=false)`,
        };
      }
    } else {
      const paidResult = paidAddonsForOptions(child.id, options, catalog);
      if (typeof paidResult === "object") {
        return { ok: false, error: paidResult.error };
      }
      paid = paidResult;
      addons += paid * slot.quantity;

      for (const optEntry of options) {
        const optQty = optEntry.quantity * effectiveQty;
        const opt = catalog.options.find(
          (o) =>
            o.id === optEntry.option_id &&
            o.organizationId === catalog.organizationId
        );
        if (!opt) {
          return {
            ok: false,
            error: `Opção não encontrada no componente: ${optEntry.option_id}`,
          };
        }
        if (opt.stockControl && opt.stock < optQty) {
          return {
            ok: false,
            error: `Estoque insuficiente para opção: ${opt.name} (disponível: ${opt.stock})`,
          };
        }
        if (opt.stockControl) {
          stockMoves.push({ kind: "option", id: opt.id, quantity: optQty });
        }
      }
    }

    const label =
      component.label?.trim() ||
      slot.displayName?.trim() ||
      child.name;

    units.push({
      componentId,
      productId: child.id,
      productName: child.name,
      unitIndex: component.unit_index ?? index + 1,
      label,
      childQtyPerCombo: slot.quantity,
      allowConfiguration: slot.allowConfiguration,
      options,
      paidAddons: paid * slot.quantity,
    });
  }

  const unitPrice = product.price + addons;
  return {
    ok: true,
    unitPrice,
    lineSubtotal: unitPrice * comboQty,
    stockMoves,
    units,
  };
}

function resolveChoiceUnits(
  product: ContractProduct,
  components: ContractComponentPayload[],
  catalog: ContractCatalog,
  comboQty: number
): ContractResult {
  const min = product.comboMinChoices ?? null;
  const max = product.comboMaxChoices ?? null;
  if (min == null || max == null || min < 1 || max < min) {
    return {
      ok: false,
      error: `Combo ${product.name} choice exige min/max choices válidos`,
    };
  }

  const activeSlots = catalog.slots.filter(
    (s) =>
      s.comboProductId === product.id &&
      s.organizationId === catalog.organizationId &&
      s.active
  );
  if (activeSlots.length === 0) {
    return { ok: false, error: `Combo ${product.name} sem opções ativas` };
  }

  if (components.length < min || components.length > max) {
    return {
      ok: false,
      error: `Combo ${product.name} exige entre ${min} e ${max} copos (recebido: ${components.length})`,
    };
  }

  let addons = 0;
  const stockByProduct = new Map<string, number>();
  const stockByOption = new Map<string, number>();
  const stockMoves: Array<{
    kind: "product" | "option";
    id: string;
    quantity: number;
  }> = [];
  const units: ResolvedComboUnit[] = [];
  const seenUnitIndex = new Set<number>();

  for (let index = 0; index < components.length; index += 1) {
    const component = components[index];
    const componentId = component.component_id?.trim() || null;
    if (!componentId) {
      return {
        ok: false,
        error: `component_id obrigatório no combo ${product.name}`,
      };
    }

    if (component.quantity != null && component.quantity !== 1) {
      return {
        ok: false,
        error: `Unidade do combo choice deve ter quantity=1 (component ${componentId})`,
      };
    }

    const unitIndex = component.unit_index ?? index + 1;
    if (unitIndex < 1) {
      return { ok: false, error: "unit_index inválido" };
    }
    if (seenUnitIndex.has(unitIndex)) {
      return {
        ok: false,
        error: `unit_index duplicado: ${unitIndex}`,
      };
    }
    seenUnitIndex.add(unitIndex);

    const slot = activeSlots.find((s) => s.id === componentId);
    if (!slot) {
      return {
        ok: false,
        error: `component_id ${componentId} não está no pool do combo ${product.name}`,
      };
    }
    if (component.product_id !== slot.componentProductId) {
      return {
        ok: false,
        error: `product_id do componente não confere com o slot ${componentId}`,
      };
    }

    const child = catalog.products.find(
      (p) =>
        p.id === slot.componentProductId &&
        p.organizationId === catalog.organizationId
    );
    if (!child) {
      return {
        ok: false,
        error: `Componente não encontrado: ${slot.componentProductId}`,
      };
    }
    if (child.status !== "active") {
      return { ok: false, error: `Componente inativo: ${child.name}` };
    }
    if (child.menuKind === "combo") {
      return { ok: false, error: `Componente não pode ser combo: ${child.name}` };
    }
    if (child.menuKind !== "assembled") {
      return {
        ok: false,
        error: `Combo choice exige produto montado: ${child.name}`,
      };
    }
    if (child.organizationId !== catalog.organizationId) {
      return { ok: false, error: "Componente de outra organização" };
    }

    stockByProduct.set(
      child.id,
      (stockByProduct.get(child.id) ?? 0) + 1 * comboQty
    );

    const options = normalizeOptions(component.options);
    let paid = 0;
    if (!slot.allowConfiguration) {
      if (options.length > 0) {
        return {
          ok: false,
          error: `Slot ${componentId} não permite options (allow_configuration=false)`,
        };
      }
    } else {
      const paidResult = paidAddonsForOptions(child.id, options, catalog);
      if (typeof paidResult === "object") {
        return { ok: false, error: paidResult.error };
      }
      paid = paidResult;
      addons += paid;

      for (const optEntry of options) {
        const opt = catalog.options.find(
          (o) =>
            o.id === optEntry.option_id &&
            o.organizationId === catalog.organizationId
        );
        if (!opt) {
          return {
            ok: false,
            error: `Opção não encontrada no componente: ${optEntry.option_id}`,
          };
        }
        if (opt.stockControl) {
          const need = optEntry.quantity * comboQty;
          stockByOption.set(
            opt.id,
            (stockByOption.get(opt.id) ?? 0) + need
          );
        }
      }
    }

    // label pode ser "Copo N" no payload; nome KDS usa productName (assembled real)
    const label = component.label?.trim() || child.name;

    units.push({
      componentId,
      productId: child.id,
      productName: child.name,
      unitIndex,
      label,
      childQtyPerCombo: 1,
      allowConfiguration: slot.allowConfiguration,
      options,
      paidAddons: paid,
    });
  }

  for (const [productId, need] of stockByProduct) {
    const child = catalog.products.find((p) => p.id === productId)!;
    if (child.stock < need) {
      return {
        ok: false,
        error: `Estoque insuficiente para componente: ${child.name} (disponível: ${child.stock})`,
      };
    }
    stockMoves.push({ kind: "product", id: productId, quantity: need });
  }

  for (const [optionId, need] of stockByOption) {
    const opt = catalog.options.find((o) => o.id === optionId)!;
    if (opt.stock < need) {
      return {
        ok: false,
        error: `Estoque insuficiente para opção: ${opt.name} (disponível: ${opt.stock})`,
      };
    }
    stockMoves.push({ kind: "option", id: optionId, quantity: need });
  }

  const unitPrice = product.price + addons;
  return {
    ok: true,
    unitPrice,
    lineSubtotal: unitPrice * comboQty,
    stockMoves,
    units: units.sort((a, b) => a.unitIndex - b.unitIndex),
  };
}

/**
 * Valida um item de venda combo (espelha PASS 1 finalize_sale / place_public 028).
 */
export function validateComboFinalizeItem(
  item: ContractItemPayload,
  catalog: ContractCatalog
): ContractResult {
  const product = catalog.products.find(
    (p) => p.id === item.product_id && p.organizationId === catalog.organizationId
  );
  if (!product) return { ok: false, error: `Produto não encontrado: ${item.product_id}` };
  if (product.status !== "active") {
    return { ok: false, error: `Produto inativo: ${product.name}` };
  }
  if (item.quantity == null || item.quantity <= 0) {
    return { ok: false, error: `Quantidade inválida para o produto ${item.product_id}` };
  }

  const components = item.components ?? [];
  const hasComponents = components.length > 0;

  if (product.menuKind === "combo" && !hasComponents) {
    return {
      ok: false,
      error: `Combo ${product.name} exige components[] com component_id`,
    };
  }

  if (!hasComponents) {
    if (product.stock < item.quantity) {
      return {
        ok: false,
        error: `Estoque insuficiente para: ${product.name} (disponível: ${product.stock})`,
      };
    }
    const unitPrice = item.unit_price ?? product.price;
    return {
      ok: true,
      unitPrice,
      lineSubtotal: unitPrice * item.quantity,
      stockMoves: [
        { kind: "product", id: product.id, quantity: item.quantity },
      ],
      units: [],
    };
  }

  if (product.menuKind !== "combo") {
    return {
      ok: false,
      error: `Item com components deve ser menu_kind=combo: ${product.name}`,
    };
  }

  if ((item.options ?? []).length > 0) {
    return {
      ok: false,
      error: `Combo ${product.name} não aceita options no item pai`,
    };
  }

  const mode: ComboSelectionMode =
    product.comboSelectionMode === "choice" ? "choice" : "fixed";

  if (mode === "choice") {
    return resolveChoiceUnits(product, components, catalog, item.quantity);
  }
  return resolveFixedUnits(product, components, catalog, item.quantity);
}

export function saleTotalFromValidatedLines(
  lines: Array<{ lineSubtotal: number }>,
  discount: number
): { subtotal: number; total: number } | { error: string } {
  const subtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  if (discount < 0) return { error: "Desconto inválido" };
  if (discount > subtotal) {
    return {
      error: `Desconto (${discount}) superior ao subtotal da venda (${subtotal})`,
    };
  }
  return { subtotal, total: subtotal - discount };
}

/** Persistência lógica: 1 filho por unidade (nunca colapsa configs diferentes). */
export function expandSaleItemChildren(input: {
  parentQuantity: number;
  units: ResolvedComboUnit[];
}): Array<{
  productId: string;
  productName: string;
  quantity: number;
  comboComponentId: string;
  comboUnitIndex: number;
  componentLabel: string;
  options: Array<{ option_id: string; quantity: number }>;
}> {
  return input.units.map((unit) => ({
    productId: unit.productId,
    productName: unit.productName,
    quantity: unit.childQtyPerCombo * input.parentQuantity,
    comboComponentId: unit.componentId,
    comboUnitIndex: unit.unitIndex,
    componentLabel: unit.label,
    options: unit.options.map((opt) => ({
      option_id: opt.option_id,
      quantity: opt.quantity * unit.childQtyPerCombo * input.parentQuantity,
    })),
  }));
}
