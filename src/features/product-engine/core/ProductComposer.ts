import { isSizeGroupName } from "../adapters/compositionAdapter";
import { loadEngineProductNode } from "../repository/productEngine.repository";
import type {
  EngineBuildState,
  EngineProductGroup,
  EngineProductNode,
  EngineProductOption,
} from "../types/productEngine.types";

export class ProductComposer {
  async compose(productId: string): Promise<EngineProductNode> {
    return loadEngineProductNode(productId);
  }

  getSizeGroup(node: EngineProductNode): EngineProductGroup | null {
    return node.groups.find((group) => isSizeGroupName(group.name)) ?? null;
  }

  getVisibleGroups(node: EngineProductNode, excludeSize = true): EngineProductGroup[] {
    return node.groups
      .filter((group) => group.active && !group.hidden)
      .filter((group) => !(excludeSize && isSizeGroupName(group.name)))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getGroupOptions(node: EngineProductNode, groupId: string): EngineProductOption[] {
    return (node.optionsByGroupId[groupId] ?? [])
      .filter((option) => option.active)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  createInitialBuildState(productId: string): EngineBuildState {
    return {
      productId,
      step: "size",
      selections: {},
      observation: "",
    };
  }

  advanceStep(node: EngineProductNode, state: EngineBuildState): EngineBuildState {
    const sizeGroup = this.getSizeGroup(node);
    const hasSize = sizeGroup ? (state.selections[sizeGroup.id]?.length ?? 0) > 0 : true;

    if (state.step === "size") {
      if (!hasSize && sizeGroup) return state;
      return { ...state, step: "groups" };
    }

    if (state.step === "groups") {
      return { ...state, step: "options" };
    }

    if (state.step === "options") {
      return { ...state, step: "review" };
    }

    return state;
  }
}

export const productComposer = new ProductComposer();
