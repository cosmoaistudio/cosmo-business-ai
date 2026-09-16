/**
 * Admin workflows for reusable composition:
 * duplicate product, create-similar, apply composition, option impact.
 * Uses existing tables only — no new schema.
 */
import { AppError } from "@/lib/errors";
import { supabase } from "@/config/supabase";
import {
  createProduct,
  getProductById,
  updateProduct,
  type CreateProductDTO,
} from "@/features/products/repository/products.repository";
import type { Product } from "@/features/products/types/product";
import {
  createOptionGroup,
  getOptionGroupById,
} from "../repository/optionGroups.repository";
import {
  createOption,
  getOptionById,
  getOptionsByGroupId,
} from "../repository/options.repository";
import {
  createProductOptionGroup,
  deleteProductOptionGroupsByProductId,
  getProductCountByGroupId,
  getProductOptionGroupsByProductId,
} from "../repository/productOptionGroups.repository";

export type CompositionCopyMode = "shared" | "independent";

export interface SimilarProductInput {
  sourceProductId: string;
  name: string;
  price: number;
  copyCategory: boolean;
  copyImage: boolean;
  copyDescription: boolean;
  copyComposition: boolean;
  compositionMode: CompositionCopyMode;
}

export interface OptionImpact {
  optionId: string;
  optionName: string;
  productCount: number;
  products: Array<{ id: string; name: string }>;
}

function toCreatePayload(
  source: Product,
  overrides: Partial<CreateProductDTO> = {}
): CreateProductDTO {
  return {
    name: overrides.name ?? `${source.name} (cópia)`,
    category: overrides.category ?? source.category,
    description: overrides.description ?? source.description,
    price: overrides.price ?? Number(source.price),
    stock: overrides.stock ?? Number(source.stock),
    min_stock: overrides.min_stock ?? Number(source.min_stock ?? 0),
    image_url:
      overrides.image_url !== undefined
        ? overrides.image_url
        : (source.image_url ?? null),
    status: overrides.status ?? source.status,
    promotionalPrice:
      overrides.promotionalPrice !== undefined
        ? overrides.promotionalPrice
        : (source.promotionalPrice ?? null),
    featured:
      overrides.featured !== undefined
        ? overrides.featured
        : source.featured === true,
  };
}

async function linkSharedComposition(
  targetProductId: string,
  sourceProductId: string
) {
  const links = await getProductOptionGroupsByProductId(sourceProductId);
  for (const link of links) {
    await createProductOptionGroup({
      product_id: targetProductId,
      group_id: link.group_id,
      sort_order: link.sort_order,
    });
  }
}

async function deepCopyComposition(
  targetProductId: string,
  sourceProductId: string
) {
  const links = await getProductOptionGroupsByProductId(sourceProductId);

  for (const link of links) {
    const group = await getOptionGroupById(link.group_id);
    const options = await getOptionsByGroupId(link.group_id);

    const newGroup = await createOptionGroup({
      name: `${group.name}`,
      description: group.description,
      selection_type: group.selection_type,
      min_selection: group.min_selection,
      max_selection: group.max_selection,
      required: group.required,
      sort_order: group.sort_order,
    });

    for (const option of options) {
      await createOption({
        group_id: newGroup.id,
        name: option.name,
        description: option.description,
        price: option.price,
        stock_control: option.stock_control,
        stock: option.stock,
        image_url: option.image_url,
        active: option.active,
        sort_order: option.sort_order,
      });
    }

    await createProductOptionGroup({
      product_id: targetProductId,
      group_id: newGroup.id,
      sort_order: link.sort_order,
    });
  }
}

export const compositionAdminService = {
  async duplicateProduct(params: {
    sourceProductId: string;
    mode: CompositionCopyMode;
    name?: string;
  }) {
    const source = await getProductById(params.sourceProductId);
    const created = await createProduct(
      toCreatePayload(source, {
        name: params.name?.trim() || `${source.name} (cópia)`,
      })
    );

    if (params.mode === "shared") {
      await linkSharedComposition(created.id, source.id);
    } else {
      await deepCopyComposition(created.id, source.id);
    }

    return created;
  },

  async createSimilarProduct(input: SimilarProductInput) {
    if (!input.name.trim()) {
      throw new AppError("Informe o nome do novo produto.");
    }
    if (input.price < 0) {
      throw new AppError("O preço não pode ser negativo.");
    }

    const source = await getProductById(input.sourceProductId);
    const created = await createProduct(
      toCreatePayload(source, {
        name: input.name.trim(),
        price: input.price,
        category: input.copyCategory ? source.category : "",
        description: input.copyDescription ? source.description : "",
        image_url: input.copyImage ? (source.image_url ?? null) : null,
        promotionalPrice: null,
        featured: false,
      })
    );

    if (input.copyComposition) {
      if (input.compositionMode === "shared") {
        await linkSharedComposition(created.id, source.id);
      } else {
        await deepCopyComposition(created.id, source.id);
      }
    }

    return created;
  },

  /** Apply source product's group links onto targets (shared references). */
  async applyCompositionToProducts(
    sourceProductId: string,
    targetProductIds: string[]
  ) {
    const uniqueTargets = [...new Set(targetProductIds)].filter(
      (id) => id !== sourceProductId
    );
    if (uniqueTargets.length === 0) {
      throw new AppError("Selecione ao menos um produto de destino.");
    }

    const links = await getProductOptionGroupsByProductId(sourceProductId);

    for (const targetId of uniqueTargets) {
      await deleteProductOptionGroupsByProductId(targetId);
      for (const link of links) {
        await createProductOptionGroup({
          product_id: targetId,
          group_id: link.group_id,
          sort_order: link.sort_order,
        });
      }
    }

    return { updated: uniqueTargets.length, groupsLinked: links.length };
  },

  async clearComposition(productIds: string[]) {
    for (const id of productIds) {
      await deleteProductOptionGroupsByProductId(id);
    }
    return { updated: productIds.length };
  },

  async bulkUpdateProducts(
    productIds: string[],
    patch: Partial<Pick<CreateProductDTO, "price" | "status" | "category">>
  ) {
    if (productIds.length === 0) {
      throw new AppError("Selecione ao menos um produto.");
    }

    const results: Product[] = [];
    for (const id of productIds) {
      results.push(await updateProduct(id, patch));
    }
    return results;
  },

  async getGroupImpact(groupId: string): Promise<{
    groupId: string;
    productCount: number;
    products: Array<{ id: string; name: string }>;
  }> {
    const impact = await getProductCountByGroupId(groupId);
    return {
      groupId,
      productCount: impact.productCount,
      products: impact.products,
    };
  },

  async getOptionImpact(optionId: string): Promise<OptionImpact> {
    const option = await getOptionById(optionId);

    const { data, error } = await supabase.rpc("get_products_by_option_id", {
      p_option_id: optionId,
    });

    if (error) {
      // Fallback: products linked to the option's group
      const links = await supabase
        .from("product_option_groups")
        .select("product_id, products(id, name)")
        .eq("group_id", option.group_id);

      if (links.error) throw links.error;

      const products = (links.data ?? [])
        .map((row) => {
          const product = row.products as
            | { id: string; name: string }
            | { id: string; name: string }[]
            | null;
          if (!product) return null;
          if (Array.isArray(product)) return product[0] ?? null;
          return product;
        })
        .filter((row): row is { id: string; name: string } => Boolean(row));

      const unique = Array.from(
        new Map(products.map((p) => [p.id, p])).values()
      );

      return {
        optionId,
        optionName: option.name,
        productCount: unique.length,
        products: unique,
      };
    }

    const products = ((data as Array<{ id: string; name: string }>) ?? []).map(
      (row) => ({ id: row.id, name: row.name })
    );

    return {
      optionId,
      optionName: option.name,
      productCount: products.length,
      products,
    };
  },

  async duplicateOption(optionId: string) {
    const option = await getOptionById(optionId);
    return createOption({
      group_id: option.group_id,
      name: `${option.name} (cópia)`,
      description: option.description,
      price: option.price,
      stock_control: option.stock_control,
      stock: option.stock,
      image_url: option.image_url,
      active: option.active,
      sort_order: option.sort_order + 1,
    });
  },

  async duplicateGroup(groupId: string) {
    const group = await getOptionGroupById(groupId);
    const options = await getOptionsByGroupId(groupId);

    const newGroup = await createOptionGroup({
      name: `${group.name} (cópia)`,
      description: group.description,
      selection_type: group.selection_type,
      min_selection: group.min_selection,
      max_selection: group.max_selection,
      required: group.required,
      sort_order: group.sort_order + 1,
    });

    for (const option of options) {
      await createOption({
        group_id: newGroup.id,
        name: option.name,
        description: option.description,
        price: option.price,
        stock_control: option.stock_control,
        stock: option.stock,
        image_url: option.image_url,
        active: option.active,
        sort_order: option.sort_order,
      });
    }

    return newGroup;
  },
};
