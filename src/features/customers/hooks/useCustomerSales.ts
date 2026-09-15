import { useCallback, useEffect, useState } from "react";
import { customersService } from "../services/customers.service";
import type { CustomerPurchase } from "../types/customer";

export function useCustomerSales(customerId?: string | null) {
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPurchases = useCallback(async () => {
    if (!customerId) {
      setPurchases([]);
      return;
    }

    try {
      setLoading(true);
      const data = await customersService.getPurchaseHistory(customerId);
      setPurchases(data);
    } catch (error) {
      console.error("Erro ao buscar histórico de compras:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  return {
    purchases,
    loading,
    reload: loadPurchases,
  };
}
