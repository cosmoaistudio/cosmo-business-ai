import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { useProductFilter, useProducts, type Product } from "@/features/products";
import { productCompositionService } from "@/features/product-composition";
import { type Customer } from "@/features/customers";
import { emitDataChanged } from "@/lib/sale-events";
import {
  CartPanel,
  CheckoutDialog,
  ComboCompositionModal,
  ProductCompositionModal,
  ProductGrid,
  useCart,
  useCheckout,
} from "@/features/pdv";
import { listComboComponents } from "@/features/product-composition/repository/comboComponents.repository";
import {
  ContextualSetupBanner,
  useContextualSetup,
} from "@/features/operation-onboarding";

import type { PaymentMethod } from "@/features/pdv/types/sale";
import { AnimatedPage, AnimatedSection } from "@/motion";

export default function PDV() {
  const { products, loading, reload: reloadProducts } = useProducts();
  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products]
  );
  const { searchQuery, setSearchQuery, filteredProducts } =
    useProductFilter(activeProducts);

  const {
    presentation,
    dismiss,
    acknowledgeSuccess,
    refreshAfterAction,
  } = useContextualSetup({
    relevantStepIds: ["first_sale"],
  });

  const gridRef = useRef<HTMLDivElement>(null);

  const {
    items,
    summary,
    discount,
    observation,
    addProduct,
    addCartItem,
    updateQuantity,
    removeItem,
    clearCart,
    updateDiscount,
    updateObservation,
    startEditItem,
    cancelEditItem,
    getEditingItem,
  } = useCart();

  const { checkout, loading: checkoutLoading } = useCheckout();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [compositionProduct, setCompositionProduct] = useState<Product | null>(
    null
  );
  const [comboProduct, setComboProduct] = useState<Product | null>(null);
  const [checkingComposition, setCheckingComposition] = useState(false);

  const editingItem = getEditingItem();

  function handleOpenCheckout() {
    if (items.length === 0) {
      toast.error("Adicione produtos ao carrinho");
      return;
    }

    setCheckoutOpen(true);
  }

  async function handleConfirmCheckout(params: {
    paymentMethod: PaymentMethod;
    paymentAmount: number;
  }) {
    await checkout({
      cartItems: items,
      paymentMethod: params.paymentMethod,
      paymentAmount: params.paymentAmount,
      discount: summary.discount,
      observation,
      customerId: selectedCustomer?.id ?? null,
      onSuccess: () => {
        clearCart();
        setSelectedCustomer(null);
        setCheckoutOpen(false);
        reloadProducts();
        emitDataChanged();
        void refreshAfterAction();
      },
    });
  }

  function handleCancelSale() {
    clearCart();
    setSelectedCustomer(null);
    toast.info("Venda cancelada");
  }

  async function handleAddProduct(product: Product) {
    if (product.status !== "active") {
      toast.error("Produto inativo no PDV");
      return;
    }

    const isCombo = product.menu_kind === "combo";
    if (!isCombo && product.stock <= 0) {
      toast.error("Produto sem estoque");
      return;
    }

    try {
      setCheckingComposition(true);

      if (isCombo) {
        const components = await listComboComponents(product.id);
        if (components.filter((row) => row.active).length === 0) {
          toast.error(
            "Combo sem componentes. Cadastre slots ou aplique a migration 026."
          );
          return;
        }
        setComboProduct(product);
        return;
      }

      const linkedGroups =
        await productCompositionService.getProductOptionGroups(product.id);

      if (linkedGroups.length > 0) {
        setCompositionProduct(product);
        return;
      }

      const existingSimple = items.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedOptions.length === 0 &&
          !item.observation &&
          !(item.comboComponents?.length)
      );

      if (existingSimple && existingSimple.quantity >= product.stock) {
        toast.warning("Quantidade máxima em estoque atingida");
        return;
      }

      addProduct(product);
    } catch (error) {
      console.error("Erro ao verificar composição do produto:", error);
      toast.error("Não foi possível adicionar o produto.");
    } finally {
      setCheckingComposition(false);
    }
  }

  function handleEditCartItem(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;
    startEditItem(itemId);
    if (item.comboComponents?.length || item.product.menu_kind === "combo") {
      setComboProduct(item.product);
      return;
    }
    setCompositionProduct(item.product);
  }

  function handleCloseComposer() {
    cancelEditItem();
    setCompositionProduct(null);
    setComboProduct(null);
  }

  function focusSaleStart() {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const input = gridRef.current?.querySelector(
      "input"
    ) as HTMLInputElement | null;
    input?.focus();
  }

  return (
    <AnimatedPage className="space-y-6">
      <ContextualSetupBanner
        presentation={presentation}
        icon={<ShoppingCart size={18} />}
        ctaLabel="Começar uma venda"
        onPrimaryAction={focusSaleStart}
        onDismiss={dismiss}
        onAcknowledgeSuccess={acknowledgeSuccess}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <AnimatedSection>
          <div ref={gridRef}>
            <ProductGrid
              products={filteredProducts}
              searchQuery={searchQuery}
              loading={loading || checkingComposition}
              onSearchChange={setSearchQuery}
              onAddProduct={handleAddProduct}
            />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.08} className="xl:sticky xl:top-6 xl:self-start">
          <CartPanel
            items={items}
            summary={summary}
            discount={discount}
            observation={observation}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onEditItem={handleEditCartItem}
            onDiscountChange={updateDiscount}
            onObservationChange={updateObservation}
            onCancelSale={handleCancelSale}
            onFinalizeSale={handleOpenCheckout}
          />
        </AnimatedSection>
      </div>

      {compositionProduct && (
        <ProductCompositionModal
          product={compositionProduct}
          open={Boolean(compositionProduct)}
          onClose={handleCloseComposer}
          confirmLabel={
            editingItem ? "Salvar alterações" : "Adicionar ao carrinho"
          }
          initial={
            editingItem
              ? {
                  quantity: editingItem.quantity,
                  observation: editingItem.observation,
                  selectedOptions: editingItem.selectedOptions,
                }
              : null
          }
          onConfirm={(input) => {
            addCartItem({
              ...input,
              replaceItemId: editingItem?.id,
            });
            toast.success(
              editingItem
                ? `${input.product.name} atualizado.`
                : `${input.product.name} adicionado ao carrinho.`
            );
          }}
        />
      )}

      {comboProduct && (
        <ComboCompositionModal
          product={comboProduct}
          editingItem={
            editingItem?.product.id === comboProduct.id ? editingItem : null
          }
          onClose={handleCloseComposer}
          onConfirm={(input) => {
            addCartItem({
              ...input,
              replaceItemId: editingItem?.id,
            });
            toast.success(
              editingItem
                ? `${input.product.name} atualizado.`
                : `${input.product.name} adicionado ao carrinho.`
            );
          }}
        />
      )}

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        summary={summary}
        loading={checkoutLoading}
        customer={selectedCustomer}
        onCustomerChange={setSelectedCustomer}
        onConfirm={handleConfirmCheckout}
      />
    </AnimatedPage>
  );
}
