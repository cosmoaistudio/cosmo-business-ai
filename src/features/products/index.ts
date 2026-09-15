export * from "./repository/products.repository";
export * from "./repository/productImage.repository";
export * from "./services/products.service";
export * from "./services/productImage.service";
export * from "./hooks/useProducts";
export * from "./hooks/useProductImage";
export * from "./hooks/useProductFilter";
export * from "./hooks/useProductCompositionCounts";
export * from "./utils/filterProducts";
export * from "./utils/productStats";
export * from "./utils/productImage";
export * from "./utils/imageCache";
export * from "./utils/storageError";
export * from "./utils/productMenuKind";
export * from "./utils/productCategories";
export * from "./utils/productFormChecklist";

export type { Product } from "./types/product";
export type {
  ProductImageUploadResult,
  UploadProductImageParams,
  RemoveProductImageParams,
} from "./types/productImage";

export { default as ProductForm } from "./components/ProductForm";
export { default as ProductModal } from "./components/ProductModal";
export { default as ProductQuickCreateModal } from "./components/ProductQuickCreateModal";
export { default as ProductOptionsTab } from "./components/ProductOptionsTab";
export { default as ProductSearch } from "./components/ProductSearch";
export { default as ProductImageUpload } from "./components/ProductImageUpload";
export { default as ProductThumbnail } from "./components/ProductThumbnail";
export { default as ProductLivePreview } from "./components/ProductLivePreview";
export { default as ProductCategoryField } from "./components/ProductCategoryField";
export { default as ProductFormChecklist } from "./components/ProductFormChecklist";
export { default as ProductStatusBadge } from "./components/ProductStatusBadge";
export { default as ProductMenuKindBadge } from "./components/ProductMenuKindBadge";
export { default as ProductMenuFilters } from "./components/ProductMenuFilters";
export {
  default as ProductCreateTypeDialog,
  type CreateProductIntent,
} from "./components/ProductCreateTypeDialog";
export { default as DeleteProductDialog } from "./components/DeleteProductDialog";
