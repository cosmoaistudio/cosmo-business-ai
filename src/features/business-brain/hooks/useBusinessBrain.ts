import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/features/auth";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

import { businessBrainService } from "../services/businessBrain.service";
import type { BrainAskResponse } from "../types/businessBrain.types";

export function useBusinessBrain() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? null;
  const [askDraft, setAskDraft] = useState("");
  const [askResult, setAskResult] = useState<BrainAskResponse | null>(null);
  const [asking, setAsking] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.businessBrain.snapshot(organizationId),
    queryFn: () => businessBrainService.getSnapshot(organizationId),
  });

  const domainsByLevel = useMemo(() => {
    const snapshot = query.data;
    if (!snapshot) return null;
    return snapshot.domains;
  }, [query.data]);

  async function submitQuestion(question?: string) {
    const value = (question ?? askDraft).trim();
    if (!value) {
      toast.error("Digite uma pergunta.");
      return;
    }
    try {
      setAsking(true);
      const result = await businessBrainService.ask({ question: value });
      setAskResult(result);
      setAskDraft(value);
      toast.message("Pergunta registrada — provider de IA em breve.");
    } catch (error) {
      logger.error("Business Brain ask error:", error);
      toast.error(
        error instanceof Error ? error.message : "Falha ao processar pergunta."
      );
    } finally {
      setAsking(false);
    }
  }

  return {
    snapshot: query.data ?? null,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error,
    reload: () => void query.refetch(),
    domainsByLevel,
    askDraft,
    setAskDraft,
    askResult,
    asking,
    submitQuestion,
  };
}
