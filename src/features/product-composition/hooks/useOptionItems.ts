import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { productCompositionService } from "../services/productComposition.service";
import type { OptionGroup } from "../types/optionGroup";
import type {
  CompositionOptionWithGroup,
  OptionStatusFilter,
} from "../types/option";

const PAGE_SIZE = 10;

export function useOptionItems() {
  const [options, setOptions] = useState<CompositionOptionWithGroup[]>([]);
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OptionStatusFilter>("all");
  const [groupId, setGroupId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const reloadGroups = useCallback(async () => {
    try {
      const data = await productCompositionService.getOptionGroups();
      setGroups(data);
    } catch (error) {
      console.error("Erro ao buscar grupos de opções:", error);
      toast.error("Não foi possível carregar os grupos. Tente novamente.");
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);

      const result = await productCompositionService.getOptionsPaginated({
        search,
        page,
        pageSize: PAGE_SIZE,
        status,
        groupId: groupId || undefined,
      });

      setOptions(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Erro ao buscar itens de opções:", error);
      toast.error("Não foi possível carregar os itens. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, groupId]);

  useEffect(() => {
    reloadGroups();
  }, [reloadGroups]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: OptionStatusFilter) {
    setStatus(value);
    setPage(1);
  }

  function handleGroupChange(value: string) {
    setGroupId(value);
    setPage(1);
  }

  return {
    options,
    groups,
    loading,
    search,
    setSearch: handleSearchChange,
    status,
    setStatus: handleStatusChange,
    groupId,
    setGroupId: handleGroupChange,
    page,
    setPage,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    reload,
    reloadGroups,
  };
}
