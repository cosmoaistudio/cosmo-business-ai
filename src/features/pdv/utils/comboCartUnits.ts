import type { CartComboComponent, CartSelectedOption } from "../types/cart";

/** Shared cart signature keys for combo units (PDV + digital). */
export function buildComboUnitSignatureKeys(
  units: CartComboComponent[] | undefined
): string[] {
  return (units ?? [])
    .slice()
    .sort((a, b) => a.unitIndex - b.unitIndex)
    .map((unit) => {
      const optionPart = [...unit.selectedOptions]
        .sort((a, b) => a.optionId.localeCompare(b.optionId))
        .map((option) => {
          const qty = Math.max(1, option.quantity ?? 1);
          return qty > 1 ? `${option.optionId}x${qty}` : option.optionId;
        })
        .join("|");
      return [
        `u${unit.unitIndex}`,
        unit.componentId,
        unit.productId,
        `q${unit.quantity}`,
        optionPart,
      ].join(":");
    });
}

export function mapCartUnitsToRpcComponents(units: CartComboComponent[]) {
  return units.map((unit) => ({
    component_id: unit.componentId,
    product_id: unit.productId,
    quantity: unit.quantity,
    unit_index: unit.unitIndex,
    // Snapshot legível: nome real do assembled (não "Copo 1")
    label: unit.productName || unit.displayName,
    options: unit.selectedOptions.map((option: CartSelectedOption) => ({
      option_id: option.optionId,
      quantity: option.quantity ?? 1,
    })),
  }));
}
