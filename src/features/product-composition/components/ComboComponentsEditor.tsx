import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import AppModal from "@/components/shared/AppModal";
import ProductQuickCreateModal from "@/features/products/components/ProductQuickCreateModal";
import { productsService } from "@/features/products/services/products.service";
import type { Product } from "@/features/products/types/product";
import {
  countSaleItemsForComboComponent,
  createComboComponent,
  deleteComboComponent,
  listComboComponents,
  reorderComboComponents,
  updateComboComponent,
} from "../repository/comboComponents.repository";
import type { ProductComboComponent } from "../types/combo";
import {
  buildDefaultDisplayName,
  canAddProductAsComboComponent,
  describeRemoveImpact,
  filterComboComponentCatalog,
  nextComboSortOrder,
  normalizeSlotQuantity,
  reorderComboSlotIds,
  shouldPreserveExistingSlotId,
} from "../utils/comboAdminRules";
import ComboComponentRow from "./ComboComponentRow";
import ComboPreview from "./ComboPreview";

interface ComboComponentsEditorProps {
  comboProduct: Product;
  onProductUpdated?: (product: Product) => void;
}

export default function ComboComponentsEditor({
  comboProduct,
  onProductUpdated,
}: ComboComponentsEditorProps) {
  const navigate = useNavigate();
  const comboProductId = comboProduct.id;
  const [components, setComponents] = useState<ProductComboComponent[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createCatalogIntent, setCreateCatalogIntent] = useState<
    "simple" | "assembled" | null
  >(null);
  const [minChoices, setMinChoices] = useState(
    String(comboProduct.combo_min_choices ?? 2)
  );
  const [maxChoices, setMaxChoices] = useState(
    String(comboProduct.combo_max_choices ?? 2)
  );
  const [selectionMode, setSelectionMode] = useState<"fixed" | "choice">(
    comboProduct.combo_selection_mode === "choice" ? "choice" : "fixed"
  );

  useEffect(() => {
    setSelectionMode(
      comboProduct.combo_selection_mode === "choice" ? "choice" : "fixed"
    );
    setMinChoices(String(comboProduct.combo_min_choices ?? 2));
    setMaxChoices(String(comboProduct.combo_max_choices ?? 2));
  }, [comboProduct]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const [rows, products] = await Promise.all([
        listComboComponents(comboProductId),
        productsService.getAll(),
      ]);
      setComponents(rows);
      setCatalog(
        filterComboComponentCatalog(products, comboProductId, {
          requireAssembled: selectionMode === "choice",
        })
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao carregar produtos do combo."
      );
    } finally {
      setLoading(false);
    }
  }, [comboProductId, selectionMode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const searchableCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((product) =>
      product.name.toLowerCase().includes(query)
    );
  }, [catalog, search]);

  async function persistComboSettings(next: {
    mode: "fixed" | "choice";
    min: number;
    max: number;
  }) {
    try {
      setSaving(true);
      const updated = await productsService.update(comboProductId, {
        combo_selection_mode: next.mode,
        combo_min_choices: next.mode === "choice" ? next.min : null,
        combo_max_choices: next.mode === "choice" ? next.max : null,
      });
      onProductUpdated?.(updated);
      toast.success("Configuração do combo salva.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a configuração."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddProduct(product: Product) {
    const check = canAddProductAsComboComponent({
      comboProductId,
      candidate: product,
      requireAssembled: selectionMode === "choice",
    });
    if (!check.ok) {
      toast.warning(check.error);
      return;
    }

    try {
      setSaving(true);
      const sortOrder = nextComboSortOrder(components);
      await createComboComponent({
        combo_product_id: comboProductId,
        component_product_id: product.id,
        display_name: buildDefaultDisplayName(product.name, components.length),
        quantity: 1,
        sort_order: sortOrder,
        allow_configuration: true,
        active: true,
      });
      setAddOpen(false);
      setSearch("");
      await reload();
      toast.success(
        selectionMode === "choice"
          ? "Copo montado disponível para escolha."
          : "Produto adicionado ao combo."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível adicionar."
      );
    } finally {
      setSaving(false);
    }
  }

  async function persistUpdate(
    row: ProductComboComponent,
    patch: Parameters<typeof updateComboComponent>[1]
  ) {
    if (!shouldPreserveExistingSlotId(row.id)) {
      toast.error("Slot inválido.");
      return;
    }
    try {
      setSaving(true);
      await updateComboComponent(row.id, patch);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao salvar componente."
      );
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const ids = reorderComboSlotIds(
      components.map((row) => row.id),
      index,
      index + direction
    );
    if (!ids) return;
    try {
      setSaving(true);
      await reorderComboComponents(comboProductId, ids);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao reordenar."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(row: ProductComboComponent) {
    try {
      const impact = await countSaleItemsForComboComponent(row.id);
      const message = describeRemoveImpact(impact);
      if (!window.confirm(message)) return;

      setSaving(true);
      await deleteComboComponent(row.id);
      await reload();
      toast.success("Componente removido.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao remover."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200 p-4">
        <div className="h-5 w-40 rounded bg-slate-100" />
        <div className="h-24 rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <h3 className="text-base font-semibold text-slate-900">
            Como o cliente escolhe
          </h3>
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="radio"
              name="combo-mode"
              checked={selectionMode === "fixed"}
              disabled={saving}
              onChange={() => {
                setSelectionMode("fixed");
                void persistComboSettings({
                  mode: "fixed",
                  min: Number(minChoices) || 1,
                  max: Number(maxChoices) || 1,
                });
              }}
            />
            <span>
              <span className="block font-medium text-slate-900">
                Produtos fixos do combo
              </span>
              <span className="text-sm text-slate-500">
                Todos os itens entram sempre (modo clássico).
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
            <input
              type="radio"
              name="combo-mode"
              checked={selectionMode === "choice"}
              disabled={saving}
              onChange={() => {
                setSelectionMode("choice");
                const min = Math.max(1, Number(minChoices) || 2);
                const max = Math.max(min, Number(maxChoices) || min);
                setMinChoices(String(min));
                setMaxChoices(String(max));
                void persistComboSettings({ mode: "choice", min, max });
              }}
            />
            <span>
              <span className="block font-medium text-slate-900">
                Escolher copos montados
              </span>
              <span className="text-sm text-slate-500">
                Cliente monta o combo escolhendo quantidades entre as opções.
              </span>
            </span>
          </label>

          {selectionMode === "choice" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  Quantidade de copos
                </span>
                <input
                  type="number"
                  min={1}
                  className="cosmo-input w-full p-2.5"
                  value={maxChoices}
                  disabled={saving}
                  onChange={(event) => {
                    setMaxChoices(event.target.value);
                    setMinChoices(event.target.value);
                  }}
                  onBlur={() => {
                    const value = Math.max(1, Number(maxChoices) || 1);
                    setMinChoices(String(value));
                    setMaxChoices(String(value));
                    void persistComboSettings({
                      mode: "choice",
                      min: value,
                      max: value,
                    });
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  Mínimo
                </span>
                <input
                  type="number"
                  min={1}
                  className="cosmo-input w-full p-2.5"
                  value={minChoices}
                  disabled={saving}
                  onChange={(event) => setMinChoices(event.target.value)}
                  onBlur={() => {
                    const min = Math.max(1, Number(minChoices) || 1);
                    const max = Math.max(min, Number(maxChoices) || min);
                    setMinChoices(String(min));
                    setMaxChoices(String(max));
                    void persistComboSettings({ mode: "choice", min, max });
                  }}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  Máximo
                </span>
                <input
                  type="number"
                  min={1}
                  className="cosmo-input w-full p-2.5"
                  value={maxChoices}
                  disabled={saving}
                  onChange={(event) => setMaxChoices(event.target.value)}
                  onBlur={() => {
                    const min = Math.max(1, Number(minChoices) || 1);
                    const max = Math.max(min, Number(maxChoices) || min);
                    setMinChoices(String(min));
                    setMaxChoices(String(max));
                    void persistComboSettings({ mode: "choice", min, max });
                  }}
                />
              </label>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {selectionMode === "choice"
                ? "Copos disponíveis"
                : "Produtos do combo"}
            </h3>
            <p className="text-sm text-slate-500">
              {selectionMode === "choice"
                ? "Apenas copos montados. O cliente escolhe quantidades."
                : "Preço do combo + adicionais pagos de cada produto."}
            </p>
          </div>
          <button
            type="button"
            disabled={saving || catalog.length === 0}
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus size={16} />
            {selectionMode === "choice"
              ? "Adicionar copo montado"
              : "Adicionar produto"}
          </button>
        </div>

        {catalog.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            {selectionMode === "choice" ? (
              <>
                <p className="font-semibold">
                  Você ainda não possui copos montados ativos.
                </p>
                <p className="mt-1 text-amber-900/90">
                  Neste modo o cliente escolhe entre copos montados. Cadastre ao
                  menos um copo montado ativo para montar o pool.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateCatalogIntent("assembled")}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  Criar copo montado
                </button>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  Nenhum produto disponível para o combo.
                </p>
                <p className="mt-1 text-amber-900/90">
                  Cadastre produtos simples ou copos montados ativos para montar
                  este combo.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateCatalogIntent("simple")}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Criar produto simples
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateCatalogIntent("assembled")}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800"
                  >
                    <Plus size={16} />
                    Criar copo montado
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {components.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Nenhum item ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {components.map((row, index) => (
              <ComboComponentRow
                key={row.id}
                row={row}
                index={index}
                catalog={catalog}
                disabled={saving}
                canMoveUp={index > 0}
                canMoveDown={index < components.length - 1}
                hideQuantity={selectionMode === "choice"}
                onMoveUp={() => void move(index, -1)}
                onMoveDown={() => void move(index, 1)}
                onRemove={() => void handleRemove(row)}
                onQuantityChange={(quantity) => {
                  void persistUpdate(row, {
                    quantity: normalizeSlotQuantity(quantity),
                  });
                }}
                onDisplayNameChange={(value) => {
                  void persistUpdate(row, {
                    display_name: value || null,
                  });
                }}
                onProductChange={(productId) => {
                  const candidate = catalog.find(
                    (entry) => entry.id === productId
                  );
                  if (!candidate) return;
                  const check = canAddProductAsComboComponent({
                    comboProductId,
                    candidate,
                    requireAssembled: selectionMode === "choice",
                  });
                  if (!check.ok) {
                    toast.warning(check.error);
                    return;
                  }
                  void persistUpdate(row, { component_product_id: productId });
                }}
                onAllowConfigurationChange={(value) => {
                  void persistUpdate(row, { allow_configuration: value });
                }}
              />
            ))}
          </div>
        )}

        {selectionMode === "choice" && (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Resumo: cliente escolhe {minChoices}
            {minChoices !== maxChoices ? `–${maxChoices}` : ""} copos entre{" "}
            {components.length} opções.
          </p>
        )}
      </div>

      <ComboPreview
        product={comboProduct}
        components={components}
        selectionMode={selectionMode}
        minChoices={Number(minChoices) || null}
        maxChoices={Number(maxChoices) || null}
      />

      {addOpen && (
        <AppModal
          title={
            selectionMode === "choice"
              ? "Adicionar copo montado"
              : "Adicionar produto"
          }
          onClose={() => setAddOpen(false)}
        >
          <div className="space-y-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="cosmo-input w-full py-2.5 pl-10 pr-3"
                placeholder={
                  selectionMode === "choice"
                    ? "Pesquisar copo montado…"
                    : "Pesquisar produto…"
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
              />
            </label>

            <div className="max-h-72 space-y-2 overflow-y-auto">
              {searchableCatalog.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Nenhum produto encontrado.
                </p>
              ) : (
                searchableCatalog.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={saving}
                    onClick={() => void handleAddProduct(product)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-violet-400 hover:bg-violet-50/50"
                  >
                    <span>
                      <span className="block font-semibold text-slate-900">
                        {product.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {product.menu_kind === "assembled"
                          ? "Copo montado"
                          : "Produto simples"}
                      </span>
                    </span>
                    <Plus className="h-4 w-4 text-violet-600" />
                  </button>
                ))
              )}
            </div>
          </div>
        </AppModal>
      )}

      {createCatalogIntent && (
        <ProductQuickCreateModal
          menuKind={createCatalogIntent}
          onClose={() => setCreateCatalogIntent(null)}
          onSaved={async (productId) => {
            await reload();
            if (createCatalogIntent === "assembled" && productId) {
              void navigate(`/produtos/builder/${productId}`);
            }
          }}
        />
      )}
    </div>
  );
}
