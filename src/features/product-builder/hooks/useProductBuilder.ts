import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { emitDataChanged } from "@/lib/sale-events";
import { getErrorMessage } from "@/lib/errors";
import { resolveProductImage } from "@/features/products/utils/productImage";
import type { Product } from "@/features/products/types/product";
import type { CompositionOption } from "@/features/product-composition/types/option";
import type {
  BuilderGroupState,
  BuilderProductForm,
  BuilderRulesSummary,
  BuilderScreen,
  BuilderSize,
  SaveStatus,
} from "../types/builder";
import {
  DEFAULT_DISPLAY_CONFIG,
  isSizeGroupName,
} from "../types/builder";
import { productBuilderService } from "../services/productBuilder.service";
import {
  buildEngineNodeFromBuilder,
  validateBuilderState,
} from "../utils/builderEngineBridge";

const AUTOSAVE_DELAY_MS = 900;

function productToForm(product: Product): BuilderProductForm {
  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    description: product.description ?? "",
    status: product.status,
    image_url: resolveProductImage(product),
    sku: "",
  };
}

function optionsToSizes(options: CompositionOption[]): BuilderSize[] {
  return [...options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option, index) => ({
      id: option.id,
      optionId: option.id,
      name: option.name,
      price: option.price,
      sortOrder: index,
      active: option.active,
    }));
}

function buildGroupStates(
  allGroups: Awaited<
    ReturnType<typeof productBuilderService.loadProduct>
  >["allGroups"],
  linkedGroups: Awaited<
    ReturnType<typeof productBuilderService.loadProduct>
  >["linkedGroups"],
  optionsMap: Map<string, CompositionOption[]>,
  sizeGroupId: string | null
): BuilderGroupState[] {
  const linkedOrder = new Map(
    linkedGroups.map((link, index) => [link.group_id, index])
  );

  return allGroups
    .map((group) => {
      const link = linkedGroups.find((item) => item.group_id === group.id);
      const linked = Boolean(link);
      const isSizeGroup =
        group.id === sizeGroupId || isSizeGroupName(group.name);
      const sortOrder = linked
        ? (linkedOrder.get(group.id) ?? 0)
        : Number.MAX_SAFE_INTEGER;

      return {
        groupId: group.id,
        linkId: link?.id,
        sortOrder,
        linked,
        isSizeGroup,
        group: link?.option_groups ?? group,
        options: optionsMap.get(group.id) ?? [],
        display: { ...DEFAULT_DISPLAY_CONFIG },
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function useProductBuilder(productId?: string) {
  const [loading, setLoading] = useState(Boolean(productId));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeScreen, setActiveScreen] = useState<BuilderScreen>("editor");
  const [product, setProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<BuilderProductForm | null>(
    null
  );
  const [sizes, setSizes] = useState<BuilderSize[]>([]);
  const [sizeGroupId, setSizeGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<BuilderGroupState[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [previewSelections, setPreviewSelections] = useState<
    Record<string, string[]>
  >({});

  const readyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({
    productForm: null as BuilderProductForm | null,
    sizes: [] as BuilderSize[],
    sizeGroupId: null as string | null,
    groups: [] as BuilderGroupState[],
  });

  const linkedGroups = useMemo(
    () =>
      groups
        .filter((group) => group.linked && !group.isSizeGroup)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((group, index) => ({ ...group, sortOrder: index + 1 })),
    [groups]
  );

  const previewGroups = useMemo(() => {
    const sizeGroup = groups.find((group) => group.isSizeGroup && group.linked);
    return [...(sizeGroup ? [sizeGroup] : []), ...linkedGroups].map(
      (group, index) => ({ ...group, sortOrder: index })
    );
  }, [groups, linkedGroups]);

  const engineNode = useMemo(() => {
    if (!product || !productForm) return null;
    return buildEngineNodeFromBuilder({
      product,
      productForm,
      previewGroups,
      sizes,
    });
  }, [product, productForm, previewGroups, sizes]);

  const validation = useMemo(() => {
    if (!productForm || !engineNode) {
      return null;
    }

    return validateBuilderState({
      productForm,
      previewGroups,
      previewSelections,
      engineNode,
    });
  }, [productForm, previewGroups, previewSelections, engineNode]);

  const rulesSummary = useMemo<BuilderRulesSummary>(() => {
    const allLinked = previewGroups;
    return {
      totalGroups: allLinked.length,
      requiredGroups: allLinked.filter((group) => group.group.required).length,
      optionalGroups: allLinked.filter((group) => !group.group.required).length,
      totalOptions: allLinked.reduce(
        (sum, group) => sum + group.options.length,
        0
      ),
      pausedOptions: allLinked.reduce(
        (sum, group) =>
          sum + group.options.filter((option) => !option.active).length,
        0
      ),
      premiumGroups: allLinked.filter((group) => group.group.is_premium).length,
    };
  }, [previewGroups]);

  stateRef.current = { productForm, sizes, sizeGroupId, groups };

  const reload = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      readyRef.current = false;

      const data = await productBuilderService.loadProduct(productId);
      const builtGroups = buildGroupStates(
        data.allGroups,
        data.linkedGroups,
        data.optionsMap,
        data.sizeGroupId
      );

      const sizeGroup = builtGroups.find((group) => group.isSizeGroup);

      setProduct(data.product);
      setProductForm(productToForm(data.product));
      setSizeGroupId(data.sizeGroupId);
      setSizes(sizeGroup ? optionsToSizes(sizeGroup.options) : []);
      setGroups(builtGroups);
      setExpandedGroupId(
        builtGroups.find((group) => group.linked && !group.isSizeGroup)?.groupId ??
          null
      );
    } catch (error) {
      console.error("Erro ao carregar builder:", error);
      toast.error(getErrorMessage(error, "Erro ao carregar o builder."));
    } finally {
      setLoading(false);
      readyRef.current = true;
    }
  }, [productId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(async () => {
    if (!productId || !stateRef.current.productForm) return;

    const {
      productForm: form,
      sizes: currentSizes,
      groups: currentGroups,
      sizeGroupId: currentSizeGroupId,
    } = stateRef.current;

    try {
      setSaveStatus("saving");

      await productBuilderService.save({
        productId,
        product: {
          name: form.name.trim(),
          category: form.category.trim(),
          description: form.description.trim(),
          price: Number(form.price) || 0,
          image_url: form.image_url.trim() || null,
          status: form.status as Product["status"],
        },
        sizes: currentSizes,
        sizeGroupId: currentSizeGroupId,
        linkedGroups: currentGroups
          .filter((group) => group.linked && !group.isSizeGroup)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((group, index) => ({
            groupId: group.groupId,
            linkId: group.linkId,
            sortOrder: index + 1,
            group: group.group,
            options: group.options,
          })),
      });

      emitDataChanged();
      setSaveStatus("saved");
      await reload();
    } catch (error) {
      console.error("Erro ao salvar builder:", error);
      setSaveStatus("error");
      toast.error(getErrorMessage(error, "Erro ao salvar alterações."));
    }
  }, [productId, reload]);

  const scheduleSave = useCallback(() => {
    if (!readyRef.current) return;

    setSaveStatus("pending");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void persist();
    }, AUTOSAVE_DELAY_MS);
  }, [persist]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function updateProductForm(value: Partial<BuilderProductForm>) {
    setProductForm((current) => (current ? { ...current, ...value } : current));
    scheduleSave();
  }

  async function ensureSizeGroupReady() {
    if (!productId || sizeGroupId) return sizeGroupId;

    const group = await productBuilderService.ensureSizeGroup(productId);
    setSizeGroupId(group.id);
    setGroups((current) =>
      current
        .map((item) =>
          item.groupId === group.id
            ? { ...item, linked: true, isSizeGroup: true, group, sortOrder: 0 }
            : item
        )
        .concat(
          current.some((item) => item.groupId === group.id)
            ? []
            : [
                {
                  groupId: group.id,
                  linked: true,
                  isSizeGroup: true,
                  sortOrder: 0,
                  group,
                  options: [],
                  display: { ...DEFAULT_DISPLAY_CONFIG },
                },
              ]
        )
    );

    return group.id;
  }

  async function addSize() {
    await ensureSizeGroupReady();

    setSizes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: "Novo tamanho",
        price: 0,
        sortOrder: current.length,
        active: true,
      },
    ]);
    scheduleSave();
  }

  function updateSize(sizeId: string, patch: Partial<BuilderSize>) {
    setSizes((current) =>
      current.map((size) => (size.id === sizeId ? { ...size, ...patch } : size))
    );
    scheduleSave();
  }

  function removeSize(sizeId: string) {
    setSizes((current) => current.filter((size) => size.id !== sizeId));
    scheduleSave();
  }

  function reorderSizes(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    setSizes((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((size, index) => ({ ...size, sortOrder: index }));
    });
    scheduleSave();
  }

  function toggleGroup(groupId: string) {
    setGroups((current) => {
      const linkedCount = current.filter(
        (group) => group.linked && !group.isSizeGroup
      ).length;

      return current.map((group) => {
        if (group.groupId !== groupId || group.isSizeGroup) return group;

        const linked = !group.linked;

        return {
          ...group,
          linked,
          sortOrder: linked ? linkedCount + 1 : Number.MAX_SAFE_INTEGER,
        };
      });
    });
    scheduleSave();
  }

  async function addGroup() {
    if (!productId) return;

    try {
      const { group, link } = await productBuilderService.createGroup(productId);
      setGroups((current) => [
        ...current,
        {
          groupId: group.id,
          linkId: link.id,
          linked: true,
          isSizeGroup: false,
          sortOrder: linkedGroups.length + 1,
          group,
          options: [],
          display: { ...DEFAULT_DISPLAY_CONFIG },
        },
      ]);
      setExpandedGroupId(group.id);
      toast.success("Grupo criado.");
      scheduleSave();
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao criar grupo."));
    }
  }

  async function duplicateGroup(groupId: string) {
    if (!productId) return;

    const source = groups.find((group) => group.groupId === groupId);
    if (!source) return;

    try {
      const result = await productBuilderService.duplicateGroup(
        productId,
        source.group,
        source.options
      );

      setGroups((current) => [
        ...current,
        {
          groupId: result.group.id,
          linkId: result.link.id,
          linked: true,
          isSizeGroup: false,
          sortOrder: source.sortOrder + 1,
          group: result.group,
          options: result.options,
          display: { ...source.display },
        },
      ]);
      setExpandedGroupId(result.group.id);
      toast.success("Grupo duplicado.");
      scheduleSave();
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao duplicar grupo."));
    }
  }

  async function removeGroup(groupId: string) {
    if (!productId) return;

    const target = groups.find((group) => group.groupId === groupId);
    if (!target || target.isSizeGroup) return;

    try {
      await productBuilderService.deleteGroup(
        productId,
        groupId,
        target.linkId
      );

      setGroups((current) =>
        current.map((group) =>
          group.groupId === groupId
            ? {
                ...group,
                linked: false,
                linkId: undefined,
                sortOrder: Number.MAX_SAFE_INTEGER,
              }
            : group
        )
      );
      toast.success("Grupo removido do produto.");
      scheduleSave();
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao remover grupo."));
    }
  }

  function reorderLinkedGroups(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    setGroups((current) => {
      const linked = current
        .filter((group) => group.linked && !group.isSizeGroup)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const [moved] = linked.splice(fromIndex, 1);
      linked.splice(toIndex, 0, moved);

      const orderMap = new Map(
        linked.map((group, index) => [group.groupId, index + 1])
      );

      return current.map((group) =>
        group.linked && !group.isSizeGroup
          ? { ...group, sortOrder: orderMap.get(group.groupId) ?? 0 }
          : group
      );
    });
    scheduleSave();
  }

  function reorderOptions(groupId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;

    setGroups((current) =>
      current.map((group) => {
        if (group.groupId !== groupId) return group;

        const nextOptions = [...group.options];
        const [moved] = nextOptions.splice(fromIndex, 1);
        nextOptions.splice(toIndex, 0, moved);

        return {
          ...group,
          options: nextOptions.map((option, index) => ({
            ...option,
            sort_order: index,
            priority: index,
          })),
        };
      })
    );
    scheduleSave();
  }

  function updateGroupConfig(
    groupId: string,
    patch: Partial<BuilderGroupState["group"]>
  ) {
    setGroups((current) =>
      current.map((group) =>
        group.groupId === groupId
          ? { ...group, group: { ...group.group, ...patch } }
          : group
      )
    );
    scheduleSave();
  }

  function updateOption(
    groupId: string,
    optionId: string,
    patch: Partial<CompositionOption>
  ) {
    setGroups((current) =>
      current.map((group) =>
        group.groupId === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option
              ),
            }
          : group
      )
    );
    scheduleSave();
  }

  function updatePreviewSelections(selections: Record<string, string[]>) {
    setPreviewSelections(selections);
  }

  return {
    loading,
    saveStatus,
    activeScreen,
    setActiveScreen,
    product,
    productForm,
    sizes,
    sizeGroupId,
    groups,
    linkedGroups,
    previewGroups,
    rulesSummary,
    validation,
    engineNode,
    previewSelections,
    expandedGroupId,
    setExpandedGroupId,
    updateProductForm,
    updatePreviewSelections,
    addSize,
    updateSize,
    removeSize,
    reorderSizes,
    toggleGroup,
    addGroup,
    duplicateGroup,
    removeGroup,
    reorderLinkedGroups,
    reorderOptions,
    updateGroupConfig,
    updateOption,
    reload,
    saveNow: persist,
  };
}
