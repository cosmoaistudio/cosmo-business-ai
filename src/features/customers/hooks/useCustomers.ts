import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { onDataChanged } from "@/lib/sale-events";
import { customersService } from "../services/customers.service";
import type {
  CustomerOverviewStats,
  CustomerWithStats,
} from "../types/customer";

const PAGE_SIZE = 10;

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [overview, setOverview] = useState<CustomerOverviewStats>({
    totalCustomers: 0,
    customersWithPurchases: 0,
    totalRevenue: 0,
    newCustomersToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);

      const [paginated, overviewStats] = await Promise.all([
        customersService.getPaginated({
          search,
          page,
          pageSize: PAGE_SIZE,
        }),
        customersService.getOverview(),
      ]);

      setCustomers(paginated.data);
      setTotal(paginated.total);
      setTotalPages(paginated.totalPages);
      setOverview(overviewStats);
    } catch (error) {
      logger.error("Erro ao buscar clientes:", error);
      toast.error("Não foi possível carregar os clientes. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    return onDataChanged(loadCustomers);
  }, [loadCustomers]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return {
    customers,
    overview,
    loading,
    search,
    setSearch: handleSearchChange,
    page,
    setPage,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    reload: loadCustomers,
  };
}
