import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import AppModal from "@/components/shared/AppModal";
import { formatCurrency } from "@/lib/format";
import { listComboComponents } from "@/features/product-composition/repository/comboComponents.repository";
import type { ProductComboComponent } from "@/features/product-composition/types/combo";
import {
  ProductComposerView,
  useProductComposer,
} from "@/features/product-engine";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import {
  calculateComponentAddonsTotal,
  selectionsToCartOptions,
} from "@/features/product-engine/utils/comboPricing";
import type { Product } from "@/features/products/types/product";
import type {
  AddCartItemInput,
  CartComboComponent,
  CartItem,
} from "../types/cart";

interface ComboCompositionModalProps {
  product: Product;
  editingItem?: CartItem | null;
  onClose: () => void;
  onConfirm: (input: AddCartItemInput) => void;
  componentsLoader?: (
    comboProductId: string
  ) => Promise<ProductComboComponent[]>;
  preloadedNodes?: Record<string, EngineProductNode>;
  confirmLabel?: string;
  /** Public Pedido Digital skin — does not change PDV default. */
  visualTone?: "default" | "digital";
}

type UnitState = {
  key: string;
  pool: ProductComboComponent;
  configured: boolean;
  cartComponent: CartComboComponent;
};

function toComposerProduct(row: ProductComboComponent): Product {
  const name =
    row.component_product?.name ?? row.display_name ?? "Componente";
  return {
    id: row.component_product_id,
    name,
    category: "",
    description: "",
    price: Number(row.component_product?.price ?? 0),
    stock: Number(row.component_product?.stock ?? 9999),
    min_stock: 0,
    image_url: row.component_product?.image_url ?? null,
    status: (row.component_product?.status as Product["status"]) ?? "active",
    menu_kind: "assembled",
    created_at: new Date().toISOString(),
  };
}

function optionsPreview(component: CartComboComponent): string {
  if (component.selectedOptions.length === 0) return "Sem adicionais";
  return component.selectedOptions
    .map((option) =>
      (option.quantity ?? 1) > 1
        ? `${option.quantity}x ${option.optionName}`
        : option.optionName
    )
    .join(", ");
}

function emptyUnit(
  pool: ProductComboComponent,
  unitIndex: number
): CartComboComponent {
  const productName =
    pool.component_product?.name?.trim() ||
    pool.display_name?.trim() ||
    "Copo montado";
  return {
    componentId: pool.id,
    productId: pool.component_product_id,
    productName,
    // displayName = nome real do assembled (KDS/UI); unitIndex identifica Copo N
    displayName: productName,
    quantity: 1,
    unitIndex,
    allowConfiguration: pool.allow_configuration,
    selectedOptions: [],
    addonsTotal: 0,
  };
}

function unitHeading(unit: CartComboComponent): string {
  return `Copo ${unit.unitIndex} — ${unit.productName}`;
}

export default function ComboCompositionModal({
  product,
  editingItem,
  onClose,
  onConfirm,
  componentsLoader,
  preloadedNodes,
  confirmLabel = "Adicionar ao carrinho",
  visualTone = "default",
}: ComboCompositionModalProps) {
  const isChoice = product.combo_selection_mode === "choice";
  const minChoices = product.combo_min_choices ?? 1;
  const maxChoices = product.combo_max_choices ?? minChoices;

  const [pool, setPool] = useState<ProductComboComponent[]>([]);
  const [units, setUnits] = useState<UnitState[]>([]);
  const [pickCounts, setPickCounts] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<"pick" | "configure">(
    isChoice ? "pick" : "configure"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const activeUnit = units.find((unit) => unit.key === activeKey);
  const activeProduct = activeUnit
    ? toComposerProduct(activeUnit.pool)
    : null;
  const activePreloaded =
    activeProduct && preloadedNodes
      ? preloadedNodes[activeProduct.id] ?? null
      : null;

  const composer = useProductComposer(
    activeProduct,
    activeUnit
      ? {
          selectedOptions: activeUnit.cartComponent.selectedOptions,
          observation: activeUnit.cartComponent.observation,
          quantity: 1,
        }
      : null,
    activePreloaded ? { preloadedNode: activePreloaded } : null
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const loader = componentsLoader ?? listComboComponents;
        const rows = (await loader(product.id)).filter((row) => row.active);
        if (cancelled) return;
        if (rows.length === 0) {
          setError("Combo sem produtos. Cadastre opções no editor.");
          setPool([]);
          setUnits([]);
          return;
        }
        setPool(rows);

        if (editingItem?.comboComponents?.length) {
          const fixed = editingItem.comboComponents.map((entry, index) => {
            const poolRow =
              rows.find((row) => row.id === entry.componentId) ?? rows[0];
            const unitIndex = entry.unitIndex ?? index + 1;
            const productName =
              entry.productName?.trim() ||
              poolRow.component_product?.name?.trim() ||
              entry.displayName ||
              "Copo montado";
            return {
              key: `u-${unitIndex}`,
              pool: poolRow,
              configured: true,
              cartComponent: {
                ...entry,
                unitIndex,
                productName,
                quantity: isChoice ? 1 : Math.max(1, entry.quantity),
                displayName: productName,
              },
            };
          });
          setUnits(fixed);
          setPhase("configure");
          if (isChoice) {
            const counts: Record<string, number> = {};
            for (const unit of fixed) {
              counts[unit.pool.id] = (counts[unit.pool.id] ?? 0) + 1;
            }
            setPickCounts(counts);
          }
          return;
        }

        if (isChoice) {
          const initial: Record<string, number> = {};
          for (const row of rows) initial[row.id] = 0;
          setPickCounts(initial);
          setUnits([]);
          setPhase("pick");
        } else {
          setUnits(
            rows.map((row, index) => {
              const unitIndex = index + 1;
              const productName =
                row.component_product?.name?.trim() ||
                row.display_name?.trim() ||
                `Item ${unitIndex}`;
              return {
                key: `u-${unitIndex}`,
                pool: row,
                configured: !row.allow_configuration,
                cartComponent: {
                  componentId: row.id,
                  productId: row.component_product_id,
                  productName,
                  displayName: productName,
                  quantity: row.quantity,
                  unitIndex,
                  allowConfiguration: row.allow_configuration,
                  selectedOptions: [],
                  addonsTotal: 0,
                },
              };
            })
          );
          setPhase("configure");
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Falha ao carregar combo."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [product.id, editingItem, componentsLoader, isChoice]);

  const pickedTotal = useMemo(
    () => Object.values(pickCounts).reduce((sum, value) => sum + value, 0),
    [pickCounts]
  );

  const addonsTotal = useMemo(
    () => units.reduce((sum, unit) => sum + unit.cartComponent.addonsTotal, 0),
    [units]
  );

  const unitPrice = useMemo(
    () => Math.max(0, Number(product.price) + addonsTotal),
    [product.price, addonsTotal]
  );

  const allConfigured = units.every((unit) => unit.configured);

  const slotAddonsPreview = activeUnit
    ? calculateComponentAddonsTotal({
        componentId: activeUnit.pool.id,
        slotQuantity: isChoice ? 1 : activeUnit.pool.quantity,
        node: composer.node,
        selections: composer.selections,
        allowConfiguration: true,
      })
    : 0;

  function adjustPick(poolId: string, delta: number) {
    setPickCounts((current) => {
      const nextValue = Math.max(0, (current[poolId] ?? 0) + delta);
      const others = Object.entries(current).reduce(
        (sum, [id, value]) => (id === poolId ? sum : sum + value),
        0
      );
      if (others + nextValue > maxChoices) {
        toast.warning(`Você pode escolher no máximo ${maxChoices} copos.`);
        return current;
      }
      return { ...current, [poolId]: nextValue };
    });
  }

  function buildUnitsFromPicks() {
    if (pickedTotal < minChoices || pickedTotal > maxChoices) {
      toast.warning(`Escolha entre ${minChoices} e ${maxChoices} copos.`);
      return;
    }

    const preservedByPool = new Map<string, UnitState[]>();
    for (const unit of units) {
      const list = preservedByPool.get(unit.pool.id) ?? [];
      list.push(unit);
      preservedByPool.set(unit.pool.id, list);
    }

    const rebuilt: UnitState[] = [];
    let idx = 1;
    for (const row of pool) {
      const count = pickCounts[row.id] ?? 0;
      const preserved = preservedByPool.get(row.id) ?? [];
      for (let i = 0; i < count; i += 1) {
        const prev = preserved[i];
        const cart = prev?.cartComponent ?? emptyUnit(row, idx);
        rebuilt.push({
          key: `u-${idx}`,
          pool: row,
          configured: prev?.configured ?? !row.allow_configuration,
          cartComponent: {
            ...cart,
            unitIndex: idx,
            quantity: 1,
            componentId: row.id,
            productId: row.component_product_id,
            productName:
              row.component_product?.name?.trim() || cart.productName,
            displayName:
              row.component_product?.name?.trim() ||
              cart.productName ||
              cart.displayName,
          },
        });
        idx += 1;
      }
    }

    setUnits(rebuilt);
    setPhase("configure");
  }

  function handleSaveActiveUnit() {
    if (!activeUnit || !composer.node) return;
    if (composer.validation && !composer.validation.valid) {
      toast.error(composer.validation.errors[0] ?? "Complete as opções.");
      return;
    }

    const addons = calculateComponentAddonsTotal({
      componentId: activeUnit.pool.id,
      slotQuantity: isChoice ? 1 : activeUnit.pool.quantity,
      node: composer.node,
      selections: composer.selections,
      allowConfiguration: true,
    });

    setUnits((current) =>
      current.map((unit) =>
        unit.key === activeUnit.key
          ? {
              ...unit,
              configured: true,
              cartComponent: {
                ...unit.cartComponent,
                selectedOptions: selectionsToCartOptions(
                  composer.node!,
                  composer.selections
                ),
                addonsTotal: addons,
                observation: composer.observation,
              },
            }
          : unit
      )
    );
    setActiveKey(null);
  }

  function handleConfirmCombo() {
    if (!allConfigured || units.length === 0) {
      toast.warning("Configure todos os copos do combo.");
      return;
    }
    if (isChoice) {
      if (units.length < minChoices || units.length > maxChoices) {
        toast.warning(`Escolha entre ${minChoices} e ${maxChoices} copos.`);
        return;
      }
    }
    onConfirm({
      product,
      quantity: editingItem?.quantity ?? 1,
      unitPrice,
      selectedOptions: [],
      observation: "",
      comboComponents: units.map((unit) => unit.cartComponent),
      replaceItemId: editingItem?.id,
    });
    onClose();
  }

  if (activeKey && activeUnit?.pool.allow_configuration && activeProduct) {
    return (
      <AppModal
        title={`Configurar — ${unitHeading(activeUnit.cartComponent)}`}
        onClose={() => setActiveKey(null)}
        size="xl"
      >
        <p className="mb-3 text-sm text-slate-500">
          Adicionais deste copo. O preço base do produto montado não entra no
          combo.
        </p>
        <ProductComposerView
          productName={activeUnit.cartComponent.productName}
          basePrice={0}
          loading={composer.loading}
          blocked={composer.blocked}
          blockedReason={composer.blockedReason}
          node={composer.node}
          selections={composer.selections}
          quantity={1}
          observation={composer.observation}
          validationErrors={composer.validation?.errors ?? []}
          unitPrice={slotAddonsPreview}
          lineTotal={slotAddonsPreview}
          onToggleOption={composer.toggleOption}
          onOptionQuantityChange={composer.setOptionQuantity}
          onQuantityChange={() => undefined}
          onObservationChange={composer.setObservation}
          onConfirm={handleSaveActiveUnit}
          onCancel={() => setActiveKey(null)}
          confirmLabel="Salvar composição"
          maxQuantity={1}
          visualTone={visualTone}
        />
      </AppModal>
    );
  }

  return (
    <AppModal title={product.name} onClose={onClose} size="lg">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando combo…
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : isChoice && phase === "pick" ? (
        <div className="space-y-4">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Escolha seus {maxChoices === minChoices ? maxChoices : `${minChoices}–${maxChoices}`}{" "}
              copos
            </p>
            <p className="text-sm text-slate-500">
              Você pode repetir o mesmo sabor. Total: {pickedTotal} / {maxChoices}
            </p>
          </div>

          {pool.map((row) => {
            const count = pickCounts[row.id] ?? 0;
            return (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {row.display_name?.trim() ||
                      row.component_product?.name ||
                      "Copo montado"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Disponível para escolha
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    className="rounded-lg bg-white p-2 shadow-sm disabled:opacity-40"
                    disabled={count <= 0}
                    onClick={() => adjustPick(row.id, -1)}
                    aria-label="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                    {count}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-white p-2 shadow-sm"
                    onClick={() => adjustPick(row.id, 1)}
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="cosmo-modal-actions">
            <button
              type="button"
              className="cosmo-btn-cancel rounded-xl border px-5 py-3"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pickedTotal < minChoices || pickedTotal > maxChoices}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              onClick={buildUnitsFromPicks}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Preço do combo</p>
              {isChoice && (
                <button
                  type="button"
                  className="mt-1 text-sm font-medium text-violet-700"
                  onClick={() => setPhase("pick")}
                >
                  Alterar escolha de copos
                </button>
              )}
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(product.price)}
            </p>
          </div>

          {units.map((unit) => (
            <div
              key={unit.key}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {unit.configured ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {unitHeading(unit.cartComponent)}
                      </span>
                    ) : (
                      unitHeading(unit.cartComponent)
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {unit.cartComponent.productName}
                  </p>
                  {unit.configured && unit.pool.allow_configuration ? (
                    <p className="mt-2 text-sm text-slate-700">
                      {optionsPreview(unit.cartComponent)}
                    </p>
                  ) : !unit.pool.allow_configuration ? (
                    <p className="mt-2 text-sm text-emerald-700">
                      Incluído no combo (sem personalização)
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      Editar composição deste copo
                    </p>
                  )}
                  {unit.cartComponent.addonsTotal > 0 && (
                    <p className="mt-1 text-sm font-medium text-blue-700">
                      Adicionais +
                      {formatCurrency(unit.cartComponent.addonsTotal)}
                    </p>
                  )}
                </div>
                {unit.pool.allow_configuration ? (
                  <button
                    type="button"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => setActiveKey(unit.key)}
                  >
                    {unit.configured ? "Editar composição" : "Configurar"}
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Pronto
                  </span>
                )}
              </div>
            </div>
          ))}

          <div className="space-y-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Combo</span>
              <span>{formatCurrency(product.price)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Adicionais</span>
              <span>{formatCurrency(addonsTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(unitPrice)}</span>
            </div>
          </div>

          <div className="cosmo-modal-actions">
            <button
              type="button"
              className="cosmo-btn-cancel rounded-xl border px-5 py-3"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!allConfigured}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              onClick={handleConfirmCombo}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </AppModal>
  );
}
