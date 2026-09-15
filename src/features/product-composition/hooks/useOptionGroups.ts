import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { productCompositionService } from "../services/productComposition.service";
import type {
  OptionGroup,
  OptionGroupStatusFilter,
} from "../types/optionGroup";

const PAGE_SIZE = 10;

export function useOptionGroups() {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OptionGroupStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const reload = useCallback(async () => {
    try {
      setLoading(true);

      const result = await productCompositionService.getOptionGroupsPaginated({
        search,
        page,
        pageSize: PAGE_SIZE,
        status,
      });

      setOptionGroups(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Erro ao buscar grupos de opções:", error);
      toast.error("Não foi possível carregar os grupos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: OptionGroupStatusFilter) {
    setStatus(value);
    setPage(1);
  }

  return {
    optionGroups,
    loading,
    search,
    setSearch: handleSearchChange,
    status,
    setStatus: handleStatusChange,
    page,
    setPage,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    reload,
  };
}
