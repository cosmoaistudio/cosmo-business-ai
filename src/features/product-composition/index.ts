export * from "./repository/optionGroups.repository";
export * from "./repository/options.repository";
export * from "./repository/productOptionGroups.repository";
export * from "./services/productComposition.service";
export * from "./services/compositionAdmin.service";
export { default as ProductDuplicateDialog } from "./components/ProductDuplicateDialog";
export { default as ProductSimilarDialog } from "./components/ProductSimilarDialog";
export { default as ProductBulkEditDialog } from "./components/ProductBulkEditDialog";
export { default as ComboComponentsEditor } from "./components/ComboComponentsEditor";
export { default as ComboComponentRow } from "./components/ComboComponentRow";
export { default as ComboPreview } from "./components/ComboPreview";
export * from "./utils/comboAdminRules";
export * from "./types/combo";
export * from "./repository/comboComponents.repository";
export * from "./hooks/useOptionGroups";
export * from "./hooks/useOptions";
export * from "./hooks/useOptionItems";
export * from "./hooks/useProductOptionGroups";
export * from "./hooks/useProductOptionsEditor";
export * from "./utils/productOptionLinkRules";

export { default as OptionGroupFilters } from "./components/OptionGroupFilters";
export { default as OptionGroupForm } from "./components/OptionGroupForm";
export { default as OptionGroupModal } from "./components/OptionGroupModal";
export { default as OptionGroupWorkspaceModal } from "./components/OptionGroupWorkspaceModal";
export { default as DeleteOptionGroupDialog } from "./components/DeleteOptionGroupDialog";
export {
  default as OptionGroupStatusBadge,
  OptionGroupTypeBadge,
} from "./components/OptionGroupStatusBadge";

export { default as OptionItemFilters } from "./components/OptionItemFilters";
export { default as OptionItemForm } from "./components/OptionItemForm";
export { default as OptionItemModal } from "./components/OptionItemModal";
export { default as DeleteOptionItemDialog } from "./components/DeleteOptionItemDialog";
export { default as OptionItemStatusBadge } from "./components/OptionItemStatusBadge";
export { default as OptionImageUpload } from "./components/OptionImageUpload";

export type {
  OptionGroup,
  OptionGroupWithOptions,
  SelectionType,
  CreateOptionGroupDTO,
  UpdateOptionGroupDTO,
  OptionGroupStatusFilter,
  OptionGroupsQueryParams,
  PaginatedOptionGroups,
} from "./types/optionGroup";

export type {
  CompositionOption,
  CompositionOptionWithGroup,
  CreateCompositionOptionDTO,
  UpdateCompositionOptionDTO,
  OptionStatusFilter,
  OptionsQueryParams,
  PaginatedOptions,
} from "./types/option";

export type {
  ProductOptionGroup,
  ProductOptionGroupWithGroup,
  ProductComposition,
  CreateProductOptionGroupDTO,
  UpdateProductOptionGroupDTO,
} from "./types/productOptionGroup";

export type {
  ProductCompositionWithOptions,
  ProductOptionGroupWithOptions,
} from "./types/productComposition";
