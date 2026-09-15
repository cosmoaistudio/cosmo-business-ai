import type {
  CustomerOverviewStats,
  CustomerSalesStats,
  CustomerWithStats,
} from "../types/customer";

export function computeCustomerOverview(
  totalCustomers: number,
  newCustomersToday: number,
  sales: Array<{ customer_id: string | null; total: number }>
): CustomerOverviewStats {
  const customerIds = new Set<string>();
  let totalRevenue = 0;

  for (const sale of sales) {
    if (!sale.customer_id) continue;

    customerIds.add(sale.customer_id);
    totalRevenue += Number(sale.total);
  }

  return {
    totalCustomers,
    newCustomersToday,
    customersWithPurchases: customerIds.size,
    totalRevenue,
  };
}

export function buildCustomersSalesStats(
  sales: Array<{ customer_id: string | null; total: number; created_at: string }>
) {
  const statsMap = new Map<string, CustomerSalesStats>();

  for (const sale of sales) {
    if (!sale.customer_id) continue;

    const existing = statsMap.get(sale.customer_id);

    if (existing) {
      existing.purchaseCount += 1;
      existing.totalSpent += Number(sale.total);

      if (
        !existing.lastPurchaseAt ||
        sale.created_at > existing.lastPurchaseAt
      ) {
        existing.lastPurchaseAt = sale.created_at;
      }

      continue;
    }

    statsMap.set(sale.customer_id, {
      purchaseCount: 1,
      totalSpent: Number(sale.total),
      lastPurchaseAt: sale.created_at,
    });
  }

  return statsMap;
}

export function attachSalesStatsToCustomers(
  customers: Array<Omit<CustomerWithStats, keyof CustomerSalesStats>>,
  statsMap: Map<string, CustomerSalesStats>
): CustomerWithStats[] {
  return customers.map((customer) => {
    const stats = statsMap.get(customer.id);

    return {
      ...customer,
      purchaseCount: stats?.purchaseCount ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
      lastPurchaseAt: stats?.lastPurchaseAt ?? null,
    };
  });
}
