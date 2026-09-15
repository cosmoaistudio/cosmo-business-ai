import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import ProductsHeader from "../../components/products/ProductsHeader";
import ProductsStats from "../../components/products/stats/ProductsStats";
import ProductsTable from "../../components/products/table/ProductsTable";
import {
  DeleteProductDialog,
  ProductMenuFilters,
  ProductModal,
  ProductSearch,
  extractProductCategories,
  useProductCompositionCounts,
  useProductFilter,
  useProducts,
  type Product,
} from "@/features/products";
import {
  ProductBulkEditDialog,
  ProductDuplicateDialog,
  ProductSimilarDialog,
} from "@/features/product-composition";
import {
  ContextualSetupBanner,
  useContextualSetup,
} from "@/features/operation-onboarding";
import { AnimatedPage, AnimatedSection } from "@/motion";

export default function Products() {
  const { products, loading, reload } = useProducts();
  const categorySuggestions = useMemo(
    () => extractProductCategories(products),
    [products]
  );
  const { counts: compositionCounts } = useProductCompositionCounts(products);
  const {
    searchQuery,
    setSearchQuery,
    kindFilter,
    setKindFilter,
    filteredProducts,
  } = useProductFilter(products, compositionCounts);

  const {
    presentation,
    dismiss,
    acknowledgeSuccess,
    refreshAfterAction,
  } = useContextualSetup({
    relevantStepIds: ["first_product", "addons"],
  });

  const [createRequest, setCreateRequest] = useState(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(
    null
  );
  const [similarProduct, setSimilarProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <AnimatedPage className="space-y-8">
      <AnimatedSection>
        <ContextualSetupBanner
          presentation={presentation}
          icon={<Package size={18} />}
          ctaLabel={
            presentation.type === "pending" &&
            presentation.step.id === "first_product"
              ? "Criar meu primeiro produto"
              : undefined
          }
          onPrimaryAction={
            presentation.type === "pending"
              ? () => setCreateRequest((n) => n + 1)
              : undefined
          }
          onDismiss={dismiss}
          onAcknowledgeSuccess={acknowledgeSuccess}
        />
      </AnimatedSection>

      <AnimatedSection>
        <ProductsHeader
          reload={reload}
          openCreateRequest={createRequest}
          categorySuggestions={categorySuggestions}
          onProductSaved={() => void refreshAfterAction()}
          onAddonChanged={() => void refreshAfterAction()}
        />
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <ProductsStats products={products} />
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <div className="space-y-3">
          <ProductMenuFilters value={kindFilter} onChange={setKindFilter} />
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[240px] flex-1">
              <ProductSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Edição em massa ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <ProductsTable
          products={filteredProducts}
          loading={loading}
          searchQuery={searchQuery}
          compositionCounts={compositionCounts}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onEdit={setEditingProduct}
          onDelete={setDeletingProduct}
          onDuplicate={setDuplicateProduct}
          onCreateSimilar={setSimilarProduct}
        />
      </AnimatedSection>

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          categorySuggestions={categorySuggestions}
          onClose={() => setEditingProduct(null)}
          onAddonChanged={() => void refreshAfterAction()}
          onSaved={() => {
            reload();
            void refreshAfterAction();
          }}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct}
          open={Boolean(deletingProduct)}
          onOpenChange={(open) => {
            if (!open) setDeletingProduct(null);
          }}
          onDeleted={reload}
        />
      )}

      {duplicateProduct && (
        <ProductDuplicateDialog
          product={duplicateProduct}
          onClose={() => setDuplicateProduct(null)}
          onDone={() => {
            reload();
            void refreshAfterAction();
          }}
        />
      )}

      {similarProduct && (
        <ProductSimilarDialog
          product={similarProduct}
          onClose={() => setSimilarProduct(null)}
          onDone={() => {
            reload();
            void refreshAfterAction();
          }}
        />
      )}

      {bulkOpen && (
        <ProductBulkEditDialog
          products={products}
          selectedIds={selectedIds}
          onClose={() => setBulkOpen(false)}
          onDone={() => {
            setSelectedIds([]);
            reload();
            void refreshAfterAction();
          }}
        />
      )}
    </AnimatedPage>
  );
}
