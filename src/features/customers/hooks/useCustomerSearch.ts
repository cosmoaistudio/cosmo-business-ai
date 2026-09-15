import { useEffect, useState } from "react";
import { customersService } from "../services/customers.service";
import type { Customer } from "../types/customer";

export function useCustomerSearch() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      try {
        setLoading(true);
        const data = await customersService.search(search);
        if (active) setCustomers(data);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        if (active) setCustomers([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(loadCustomers, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  return {
    customers,
    loading,
    search,
    setSearch,
  };
}
