import { useCallback, useEffect, useState } from "react";
import { productCompositionService } from "../services/productComposition.service";
import type { CompositionOption } from "../types/option";

export function useOptions(groupId?: string) {
  const [options, setOptions] = useState<CompositionOption[]>([]);
  const [loading, setLoading] = useState(Boolean(groupId));

  const reload = useCallback(async () => {
    if (!groupId) {
      setOptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await productCompositionService.getOptionsByGroupId(groupId);
      setOptions(data);
    } catch (error) {
      console.error("Erro ao buscar opções:", error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    options,
    loading,
    reload,
  };
}
