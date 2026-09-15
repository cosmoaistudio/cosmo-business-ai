import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { beginCriticalOperation, endCriticalOperation } from "@/desktop/criticalOperation";
import type { DigitalOrderMode } from "../types/digitalStore.types";
import { useDigitalOrderingContext } from "../context/DigitalOrderingContext";
import { useDigitalMenu } from "../hooks/useDigitalMenu";
import DigitalOrderingLayout from "./DigitalOrderingLayout";
import DigitalStoreHeader from "./DigitalStoreHeader";
import DigitalMenuGrid from "./DigitalMenuGrid";
import DigitalProductSheet from "./DigitalProductSheet";
import DigitalComboSheet from "./DigitalComboSheet";
import DigitalCartDrawer from "./DigitalCartDrawer";
import DigitalCheckoutSheet from "./DigitalCheckoutSheet";
import { buildMinimumOrderError, digitalOrderingService } from "../services/digitalOrdering.service";
import { fetchPublicComboDefinition } from "../repository/publicCombo.repository";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { AddCartItemInput } from "@/features/pdv/types/cart";

interface DigitalOrderingExperienceProps {
  mode: DigitalOrderMode;
  tableLabel?: string;
}

export default function DigitalOrderingExperience({
  mode,
  tableLabel,
}: DigitalOrderingExperienceProps) {
  const navigate = useNavigate();
  const { store, context, cart } = useDigitalOrderingContext();
  const { products, loading } = useDigitalMenu(store?.organizationId ?? null, store?.slug);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [comboProductId, setComboProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const selectedMenuProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const comboMenuProduct = useMemo(
    () => products.find((product) => product.id === comboProductId) ?? null,
    [products, comboProductId]
  );

  const editingItem = cart.getEditingItem();

  if (!store) {
    return (
      <DigitalOrderingLayout store={null}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          Loja não encontrada. Configure o Pedido Digital nas configurações.
        </div>
      </DigitalOrderingLayout>
    );
  }

  const storeSlug = store.slug;

  async function openProduct(product: DigitalMenuProduct) {
    const looksLikeCombo =
      product.menuKind === "combo" || (product.comboSlots?.length ?? 0) > 0;

    if (looksLikeCombo) {
      setComboProductId(product.id);
      setSelectedProductId(null);
      return;
    }

    // Snapshot antigo sem menuKind: tenta definição pública de combo
    if (product.groups.length === 0) {
      try {
        await fetchPublicComboDefinition(storeSlug, product.id);
        setComboProductId(product.id);
        setSelectedProductId(null);
        return;
      } catch {
        // não é combo — segue sheet simples
      }
    }

    setSelectedProductId(product.id);
    setComboProductId(null);
  }

  function handleCloseSheets() {
    setSelectedProductId(null);
    setComboProductId(null);
    cart.cancelEditItem();
  }

  function handleAddConfigured(input: AddCartItemInput) {
    cart.addCartItem({
      ...input,
      replaceItemId: input.replaceItemId ?? cart.editingItemId ?? undefined,
      engineChannel: "delivery",
    });
    toast.success("Item adicionado ao carrinho.");
    handleCloseSheets();
  }

  const handleConfirmOrder = async () => {
    if (cart.items.length === 0) return;

    if (store.minimumOrder > 0 && cart.summary.subtotal < store.minimumOrder) {
      toast.error(buildMinimumOrderError(store.minimumOrder));
      return;
    }

    setSubmitting(true);
    beginCriticalOperation(
      "digital-checkout",
      "Há um pedido sendo processado. Aguarde concluir antes de atualizar."
    );
    try {
      const orderContext = {
        ...context,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress:
          mode === "delivery" ? deliveryAddress.trim() || undefined : undefined,
      };

      const { order } = await digitalOrderingService.placeOrder({
        items: cart.items,
        paymentMethod,
        paymentAmount: cart.summary.total,
        discount: cart.summary.discount,
        couponCode: cart.coupon?.code ?? null,
        observation: cart.observation,
        organizationId: store.organizationId,
        storeSlug: store.slug,
        context: orderContext,
      });

      cart.clearCart();
      setCheckoutOpen(false);
      toast.success(`Pedido #${order.saleNumber} recebido!`);
      navigate(`/order-status/${order.id}?store=${encodeURIComponent(store.slug)}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível finalizar o pedido. Tente novamente."
      );
    } finally {
      endCriticalOperation("digital-checkout");
      setSubmitting(false);
    }
  };

  return (
    <DigitalOrderingLayout
      store={store}
      footer={
        cart.itemCount > 0 ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{cart.itemCount} itens</p>
                <p className="text-xl font-bold">
                  R$ {cart.summary.total.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-4 font-semibold text-white"
                style={{ backgroundColor: store.theme.primaryColor }}
              >
                <ShoppingBag className="h-5 w-5" />
                Ver carrinho
              </button>
            </div>
          </div>
        ) : null
      }
    >
      <DigitalStoreHeader store={store} mode={mode} tableLabel={tableLabel} />
      <DigitalMenuGrid
        products={products}
        loading={loading}
        onSelectProduct={(productId) => {
          const product = products.find((entry) => entry.id === productId);
          if (!product) return;
          openProduct(product);
        }}
      />

      <DigitalProductSheet
        productId={selectedProductId}
        open={selectedProductId != null && selectedMenuProduct?.menuKind !== "combo"}
        onClose={handleCloseSheets}
        onAddToCart={(result) => {
          if (result.valid && result.cartInput) {
            cart.addCartItem({
              ...result.cartInput,
              replaceItemId: cart.editingItemId ?? undefined,
              engineChannel: "delivery",
            });
            handleCloseSheets();
          }
        }}
      />

      <DigitalComboSheet
        menuProduct={comboMenuProduct}
        storeSlug={store.slug}
        open={comboProductId != null}
        editingItem={
          editingItem?.product.id === comboProductId ? editingItem : null
        }
        onClose={handleCloseSheets}
        onConfirm={handleAddConfigured}
      />

      <DigitalCartDrawer
        open={cartOpen}
        items={cart.items}
        itemCount={cart.itemCount}
        subtotal={cart.summary.subtotal}
        total={cart.summary.total}
        deliveryFee={cart.summary.deliveryFee}
        discount={cart.summary.discount}
        observation={cart.observation}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onDuplicate={cart.duplicateItem}
        onEdit={(itemId) => {
          const item = cart.items.find((entry) => entry.id === itemId);
          if (!item) return;
          cart.startEditItem(itemId);
          setCartOpen(false);
          if (
            item.product.menu_kind === "combo" ||
            (item.comboComponents?.length ?? 0) > 0
          ) {
            setComboProductId(item.product.id);
            setSelectedProductId(null);
            return;
          }
          setSelectedProductId(item.product.id);
          setComboProductId(null);
        }}
        onObservationChange={cart.setObservation}
      />

      <DigitalCheckoutSheet
        open={checkoutOpen}
        total={cart.summary.total}
        subtotal={cart.summary.subtotal}
        minimumOrder={store.minimumOrder}
        deliveryFee={cart.summary.deliveryFee}
        loading={submitting}
        paymentMethod={paymentMethod}
        customerName={customerName}
        customerPhone={customerPhone}
        deliveryAddress={deliveryAddress}
        showDeliveryFields={mode === "delivery"}
        couponCode={cart.coupon?.code ?? null}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmOrder}
        onPaymentChange={setPaymentMethod}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onDeliveryAddressChange={setDeliveryAddress}
        onApplyCoupon={cart.applyCoupon}
        onRemoveCoupon={cart.removeCoupon}
      />
    </DigitalOrderingLayout>
  );
}
