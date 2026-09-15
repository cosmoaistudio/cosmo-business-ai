import { AppError } from "@/lib/errors";
import { emitAutomationEvent } from "@/lib/automation-events";
import {
  createOptionGroup,
  deleteOptionGroup,
  getOptionGroupById,
  getOptionGroups,
  getOptionGroupsPaginated,
  updateOptionGroup,
  type CreateOptionGroupDTO,
  type OptionGroupsQueryParams,
  type UpdateOptionGroupDTO,
} from "../repository/optionGroups.repository";
import {
  createOption,
  deleteOption,
  getOptionById,
  getOptionsByGroupId,
  getOptionsPaginated,
  updateOption,
  type CreateCompositionOptionDTO,
  type OptionsQueryParams,
  type UpdateCompositionOptionDTO,
} from "../repository/options.repository";
import {
  createProductOptionGroup,
  deleteProductOptionGroup,
  deleteProductOptionGroupsByProductId,
  getProductOptionGroupById,
  getProductOptionGroupsByProductId,
  updateProductOptionGroup,
  type CreateProductOptionGroupDTO,
  type UpdateProductOptionGroupDTO,
} from "../repository/productOptionGroups.repository";
import type { OptionGroupWithOptions } from "../types/optionGroup";
import type { ProductComposition } from "../types/productOptionGroup";

function validateSelectionRules(input: {
  selection_type: "checkbox" | "radio";
  min_selection: number;
  max_selection: number;
  required: boolean;
}) {
  if (input.max_selection < input.min_selection) {
    throw new AppError(
      "A seleção máxima deve ser maior ou igual à seleção mínima."
    );
  }

  if (input.required && input.max_selection < 1) {
    throw new AppError(
      "Grupos obrigatórios precisam permitir ao menos uma seleção."
    );
  }

  if (input.selection_type === "radio" && input.max_selection !== 1) {
    throw new AppError(
      "Grupos do tipo radio devem permitir no máximo uma seleção."
    );
  }
}

export const productCompositionService = {
  async getOptionGroups() {
    return getOptionGroups();
  },

  async getOptionGroupsPaginated(params: OptionGroupsQueryParams = {}) {
    return getOptionGroupsPaginated(params);
  },

  async getOptionGroupById(id: string) {
    return getOptionGroupById(id);
  },

  async getOptionGroupWithOptions(id: string): Promise<OptionGroupWithOptions> {
    const [group, options] = await Promise.all([
      getOptionGroupById(id),
      getOptionsByGroupId(id),
    ]);

    return {
      ...group,
      options,
    };
  },

  async createOptionGroup(payload: CreateOptionGroupDTO) {
    validateSelectionRules(payload);
    return createOptionGroup(payload);
  },

  async updateOptionGroup(id: string, payload: UpdateOptionGroupDTO) {
    if (
      payload.selection_type ||
      payload.min_selection !== undefined ||
      payload.max_selection !== undefined ||
      payload.required !== undefined
    ) {
      const current = await getOptionGroupById(id);
      validateSelectionRules({
        selection_type: payload.selection_type ?? current.selection_type,
        min_selection: payload.min_selection ?? current.min_selection,
        max_selection: payload.max_selection ?? current.max_selection,
        required: payload.required ?? current.required,
      });
    }

    return updateOptionGroup(id, payload);
  },

  async deleteOptionGroup(id: string) {
    return deleteOptionGroup(id);
  },

  async getOptionsByGroupId(groupId: string) {
    return getOptionsByGroupId(groupId);
  },

  async getOptionsPaginated(params: OptionsQueryParams = {}) {
    return getOptionsPaginated(params);
  },

  async getOptionById(id: string) {
    return getOptionById(id);
  },

  async createOption(payload: CreateCompositionOptionDTO) {
    if (payload.price < 0) {
      throw new AppError("O preço da opção não pode ser negativo.");
    }

    if (payload.stock_control && payload.stock < 0) {
      throw new AppError("O estoque da opção não pode ser negativo.");
    }

    return createOption(payload);
  },

  async updateOption(id: string, payload: UpdateCompositionOptionDTO) {
    if (payload.price !== undefined && payload.price < 0) {
      throw new AppError("O preço da opção não pode ser negativo.");
    }

    if (payload.stock !== undefined && payload.stock < 0) {
      throw new AppError("O estoque da opção não pode ser negativo.");
    }

    const previous =
      payload.active !== undefined ? await getOptionById(id) : null;

    const updated = await updateOption(id, payload);

    if (previous && payload.active !== undefined && previous.active !== payload.active) {
      emitAutomationEvent(
        payload.active ? "OPTION_ACTIVATED" : "OPTION_PAUSED",
        {
          module: "products",
          optionId: id,
          optionName: updated.name,
          active: updated.active,
          entityId: id,
          entityType: "option",
        }
      );
    }

    return updated;
  },

  async deleteOption(id: string) {
    return deleteOption(id);
  },

  async getProductComposition(productId: string): Promise<ProductComposition> {
    const groups = await getProductOptionGroupsByProductId(productId);

    return {
      product_id: productId,
      groups,
    };
  },

  async getProductCompositionWithOptions(productId: string) {
    const groups = await getProductOptionGroupsByProductId(productId);

    const groupsWithOptions = await Promise.all(
      groups.map(async (link) => {
        const options = await getOptionsByGroupId(link.group_id);
        return {
          ...link,
          options: options.filter((option) => option.active),
        };
      })
    );

    return {
      product_id: productId,
      groups: groupsWithOptions,
    };
  },

  async getProductOptionGroups(productId: string) {
    return getProductOptionGroupsByProductId(productId);
  },

  async getProductOptionGroupById(id: string) {
    return getProductOptionGroupById(id);
  },

  async linkProductOptionGroup(payload: CreateProductOptionGroupDTO) {
    return createProductOptionGroup(payload);
  },

  async updateProductOptionGroupLink(
    id: string,
    payload: UpdateProductOptionGroupDTO
  ) {
    return updateProductOptionGroup(id, payload);
  },

  async unlinkProductOptionGroup(id: string) {
    return deleteProductOptionGroup(id);
  },

  async unlinkAllProductOptionGroups(productId: string) {
    return deleteProductOptionGroupsByProductId(productId);
  },
};
