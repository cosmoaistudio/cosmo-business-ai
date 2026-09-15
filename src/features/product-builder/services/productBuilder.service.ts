import { productsService } from "@/features/products/services/products.service";
import { productCompositionService } from "@/features/product-composition/services/productComposition.service";
import type { CompositionOption } from "@/features/product-composition/types/option";
import type { OptionGroup } from "@/features/product-composition/types/optionGroup";
import type { BuilderSavePayload, BuilderSize } from "../types/builder";
import { defaultOptionGroup, isSizeGroupName as checkSizeGroupName } from "../types/builder";
import {
  extractEnterpriseGroupPayload,
  extractEnterpriseOptionPayload,
} from "../utils/builderEngineBridge";

const SIZE_GROUP_DEFAULTS = {
  name: "Tamanhos",
  description: "Escolha o tamanho do produto",
  selection_type: "radio" as const,
  min_selection: 1,
  max_selection: 1,
  required: true,
  sort_order: 0,
  group_type: "single_choice" as const,
  display_style: "list" as const,
  max_free: 0,
  allow_repeat: false,
  allow_quantity: false,
  hidden: false,
  priority: 0,
  is_premium: false,
  is_recommended: false,
};

function stripUndefined<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as T;
}

async function syncSizeOptions(groupId: string, sizes: BuilderSize[]) {
  const existing = await productCompositionService.getOptionsByGroupId(groupId);
  const existingIds = new Set(existing.map((option) => option.id));
  const desiredIds = new Set(
    sizes.filter((size) => size.optionId).map((size) => size.optionId!)
  );

  await Promise.all(
    existing
      .filter((option) => !desiredIds.has(option.id))
      .map((option) => productCompositionService.deleteOption(option.id))
  );

  for (const [index, size] of sizes.entries()) {
    const payload = {
      name: size.name.trim(),
      description: null,
      price: size.price,
      stock_control: false,
      stock: 0,
      image_url: null,
      active: size.active,
      sort_order: index,
      priority: index,
    };

    if (size.optionId && existingIds.has(size.optionId)) {
      await productCompositionService.updateOption(size.optionId, payload);
      continue;
    }

    await productCompositionService.createOption({
      group_id: groupId,
      ...payload,
    });
  }
}

async function syncGroupOptions(options: CompositionOption[]) {
  for (const [index, option] of options.entries()) {
    await productCompositionService.updateOption(option.id, stripUndefined({
      name: option.name.trim(),
      description: option.description,
      price: option.price,
      stock_control: option.stock_control,
      stock: option.stock,
      image_url: option.image_url,
      active: option.active,
      sort_order: index,
      ...extractEnterpriseOptionPayload({ ...option, priority: option.priority ?? index }),
    }));
  }
}

function buildGroupUpdatePayload(group: OptionGroup) {
  return stripUndefined({
    name: group.name.trim(),
    description: group.description,
    selection_type: group.selection_type,
    min_selection: group.min_selection,
    max_selection: group.max_selection,
    required: group.required,
    sort_order: group.sort_order,
    ...extractEnterpriseGroupPayload(group),
  });
}

export const productBuilderService = {
  async loadProduct(productId: string) {
    const [product, allGroups, linkedGroups] = await Promise.all([
      productsService.getById(productId),
      productCompositionService.getOptionGroups(),
      productCompositionService.getProductOptionGroups(productId),
    ]);

    const optionsByGroup = await Promise.all(
      allGroups.map(async (group) => ({
        groupId: group.id,
        options: await productCompositionService.getOptionsByGroupId(group.id),
      }))
    );

    const optionsMap = new Map(
      optionsByGroup.map((entry) => [entry.groupId, entry.options])
    );

    const linkedIds = new Set(linkedGroups.map((link) => link.group_id));

    const sizeLink = linkedGroups.find((link) =>
      checkSizeGroupName(link.option_groups?.name ?? "")
    );

    return {
      product,
      allGroups,
      linkedGroups,
      optionsMap,
      linkedIds,
      sizeGroupId: sizeLink?.group_id ?? null,
    };
  },

  async ensureSizeGroup(productId: string) {
    const linkedGroups =
      await productCompositionService.getProductOptionGroups(productId);

    const existing = linkedGroups.find((link) =>
      checkSizeGroupName(link.option_groups?.name ?? "")
    );

    if (existing?.option_groups) {
      return existing.option_groups;
    }

    const group = await productCompositionService.createOptionGroup({
      ...SIZE_GROUP_DEFAULTS,
    });

    await productCompositionService.linkProductOptionGroup({
      product_id: productId,
      group_id: group.id,
      sort_order: 0,
    });

    return group;
  },

  async createGroup(productId: string, name = "Novo grupo") {
    const defaults = defaultOptionGroup(name);
    const group = await productCompositionService.createOptionGroup({
      name,
      description: defaults.description ?? null,
      selection_type: defaults.selection_type ?? "checkbox",
      min_selection: defaults.min_selection ?? 0,
      max_selection: defaults.max_selection ?? 1,
      required: defaults.required ?? false,
      sort_order: 999,
      group_type: defaults.group_type,
      display_style: defaults.display_style,
      max_free: defaults.max_free,
      allow_repeat: defaults.allow_repeat,
      allow_quantity: defaults.allow_quantity,
      hidden: defaults.hidden,
      priority: defaults.priority,
      icon: defaults.icon,
      color: defaults.color,
      is_premium: defaults.is_premium,
      is_recommended: defaults.is_recommended,
    } as Parameters<typeof productCompositionService.createOptionGroup>[0]);

    const link = await productCompositionService.linkProductOptionGroup({
      product_id: productId,
      group_id: group.id,
      sort_order: 999,
    });

    return { group, link };
  },

  async duplicateGroup(productId: string, source: OptionGroup, options: CompositionOption[]) {
    const enterprise = extractEnterpriseGroupPayload(source);

    const group = await productCompositionService.createOptionGroup({
      name: `${source.name} (cópia)`,
      description: source.description,
      selection_type: source.selection_type,
      min_selection: source.min_selection,
      max_selection: source.max_selection,
      required: source.required,
      sort_order: source.sort_order + 1,
      ...enterprise,
    } as Parameters<typeof productCompositionService.createOptionGroup>[0]);

    const createdOptions: CompositionOption[] = [];

    for (const [index, option] of options.entries()) {
      const created = await productCompositionService.createOption(stripUndefined({
        group_id: group.id,
        name: option.name,
        description: option.description,
        price: option.price,
        stock_control: option.stock_control,
        stock: option.stock,
        image_url: option.image_url,
        active: option.active,
        sort_order: index,
        ...extractEnterpriseOptionPayload({ ...option, priority: option.priority ?? index }),
      }) as Parameters<typeof productCompositionService.createOption>[0]);
      createdOptions.push(created);
    }

    const link = await productCompositionService.linkProductOptionGroup({
      product_id: productId,
      group_id: group.id,
      sort_order: source.sort_order + 1,
    });

    return { group, link, options: createdOptions };
  },

  async deleteGroup(productId: string, groupId: string, linkId?: string) {
    const links = await productCompositionService.getProductOptionGroups(productId);
    const link = linkId
      ? links.find((entry) => entry.id === linkId)
      : links.find((entry) => entry.group_id === groupId);

    if (link) {
      await productCompositionService.unlinkProductOptionGroup(link.id);
    }
  },

  async save(payload: BuilderSavePayload) {
    const hasSizes = payload.sizes.length > 0;
    const minSizePrice = hasSizes
      ? Math.min(...payload.sizes.map((size) => size.price))
      : Number(payload.product.price ?? 0);

    const { sku: _sku, ...productPayload } = payload.product as typeof payload.product & {
      sku?: string;
    };

    await productsService.update(payload.productId, {
      ...productPayload,
      price: hasSizes ? 0 : minSizePrice,
    });

    if (payload.sizeGroupId && payload.sizes.length > 0) {
      await productCompositionService.updateOptionGroup(payload.sizeGroupId, {
        ...SIZE_GROUP_DEFAULTS,
      });

      await syncSizeOptions(payload.sizeGroupId, payload.sizes);
    }

    const currentLinks = await productCompositionService.getProductOptionGroups(
      payload.productId
    );

    const desiredGroupIds = new Set(
      payload.linkedGroups.map((group) => group.groupId)
    );

    if (payload.sizeGroupId) {
      desiredGroupIds.add(payload.sizeGroupId);
    }

    const linksToRemove = currentLinks.filter(
      (link) => !desiredGroupIds.has(link.group_id)
    );

    await Promise.all(
      linksToRemove.map((link) =>
        productCompositionService.unlinkProductOptionGroup(link.id)
      )
    );

    const existingLinks = currentLinks.filter((link) =>
      desiredGroupIds.has(link.group_id)
    );

    const existingByGroupId = new Map(
      existingLinks.map((link) => [link.group_id, link])
    );

    for (const groupState of payload.linkedGroups) {
      await productCompositionService.updateOptionGroup(
        groupState.groupId,
        buildGroupUpdatePayload(groupState.group)
      );

      await syncGroupOptions(groupState.options);

      const existing = existingByGroupId.get(groupState.groupId);

      if (existing) {
        await productCompositionService.updateProductOptionGroupLink(
          existing.id,
          { sort_order: groupState.sortOrder }
        );
        continue;
      }

      await productCompositionService.linkProductOptionGroup({
        product_id: payload.productId,
        group_id: groupState.groupId,
        sort_order: groupState.sortOrder,
      });
    }
  },
};
