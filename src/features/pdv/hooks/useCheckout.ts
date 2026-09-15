import { useCallback, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { beginCriticalOperation, endCriticalOperation } from "@/desktop/criticalOperation";
import { pdvService } from "../services/pdv.service";
import type { CartItem } from "../types/cart";
import type {
  FinalizeSaleResult,
  PaymentMethod,
} from "../types/sale";

interface CheckoutParams {
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  discount?: number;
  observation?: string;
  customerId?: string | null;
  onSuccess?: (result: FinalizeSaleResult) => void;
}

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const checkout = useCallback(
    async ({
      cartItems,
      paymentMethod,
      paymentAmount,
      discount = 0,
      observation,
      customerId,
      onSuccess,
    }: CheckoutParams) => {
      if (cartItems.length === 0) {
        toast.error("Adicione produtos ao carrinho");
        return null;
      }

      try {
        setLoading(true);
        beginCriticalOperation(
          "pdv-checkout",
          "Há uma venda sendo finalizada. Aguarde concluir antes de atualizar."
        );

        const result = await pdvService.finalizeSaleFromCart(
          cartItems,
          paymentMethod,
          paymentAmount,
          discount,
          observation,
          customerId,
          profile?.organization_id ?? null
        );

        toast.success(
          `Venda #${result.sale_number} finalizada com sucesso!`
        );

        onSuccess?.(result);
        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao finalizar venda";

        toast.error(message);
        return null;
      } finally {
        endCriticalOperation("pdv-checkout");
        setLoading(false);
      }
    },
    [profile?.organization_id]
  );

  return {
    checkout,
    loading,
  };
}
