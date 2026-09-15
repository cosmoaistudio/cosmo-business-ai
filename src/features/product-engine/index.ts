export * from "./types/productEngine.types";

export * from "./adapters/compositionAdapter";

export { ProductPricingEngine, productPricingEngine } from "./engines/ProductPricingEngine";
export { ProductValidator, productValidator } from "./engines/ProductValidator";
export { ProductRulesEngine, productRulesEngine } from "./engines/ProductRulesEngine";
export {
  ProductDependencyEngine,
  productDependencyEngine,
} from "./engines/ProductDependencyEngine";
export {
  ProductAvailabilityEngine,
  productAvailabilityEngine,
} from "./engines/ProductAvailabilityEngine";

export { ProductComposer, productComposer } from "./core/ProductComposer";
export { ProductBuilder, productBuilder } from "./core/ProductBuilder";
export type { ProductBuilderResult } from "./core/ProductBuilder";
export { ProductSummary, productSummary } from "./core/ProductSummary";
export { SummaryBuilder, summaryBuilder } from "./core/SummaryBuilder";
export type { SummaryBundle, SummaryChannel } from "./core/SummaryBuilder";
export { ProductEngine, productEngine } from "./core/ProductEngine";

export {
  useProductComposer,
  type ComposerInitialState,
} from "./hooks/useProductComposer";
export { default as ProductComposerView } from "./components/ProductComposerView";

export * from "./integrations";
export * from "./repository/productEngine.repository";
