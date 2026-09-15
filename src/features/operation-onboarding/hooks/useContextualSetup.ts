import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import type { OperationSetupStepId } from "../types";
import { useOperationSetup } from "./useOperationSetup";
import {
  dismissContextualStep,
  isContextualStepDismissed,
  markContextualStepCelebrated,
  wasContextualStepCelebrated,
} from "../utils/contextualDismiss";
import {
  CONTEXTUAL_SUCCESS_COPY,
  resolveContextualPresentation,
  type ContextualPresentation,
} from "../utils/resolveContextualPresentation";

interface UseContextualSetupOptions {
  relevantStepIds: OperationSetupStepId[];
}

export function useContextualSetup({
  relevantStepIds,
}: UseContextualSetupOptions) {
  const { profile, user } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const userId = user?.id ?? profile?.user_id ?? "";
  const { status, loading, reload } = useOperationSetup();
  const [dismissVersion, setDismissVersion] = useState(0);
  const [celebrateVersion, setCelebrateVersion] = useState(0);

  const watchedIncompleteRef = useRef<OperationSetupStepId[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (watchedIncompleteRef.current !== null) return;
    watchedIncompleteRef.current = relevantStepIds.filter((id) => {
      const step = status.steps.find((s) => s.id === id);
      return step ? !step.completed : false;
    });
  }, [loading, relevantStepIds, status.steps]);

  const presentation: ContextualPresentation = useMemo(() => {
    void dismissVersion;
    void celebrateVersion;
    if (loading) return { type: "none" };

    return resolveContextualPresentation({
      status,
      relevantStepIds,
      watchedIncompleteIds: watchedIncompleteRef.current ?? relevantStepIds,
      isDismissed: (stepId) =>
        isContextualStepDismissed(organizationId, userId, stepId),
      wasCelebrated: (stepId) =>
        wasContextualStepCelebrated(organizationId, userId, stepId),
    });
  }, [
    loading,
    status,
    relevantStepIds,
    organizationId,
    userId,
    dismissVersion,
    celebrateVersion,
  ]);

  const dismiss = useCallback(() => {
    if (presentation.type === "pending") {
      dismissContextualStep(organizationId, userId, presentation.step.id);
      setDismissVersion((v) => v + 1);
      return;
    }
    if (presentation.type === "success") {
      markContextualStepCelebrated(
        organizationId,
        userId,
        presentation.completedStep.id
      );
      setCelebrateVersion((v) => v + 1);
    }
  }, [organizationId, userId, presentation]);

  const acknowledgeSuccess = useCallback(() => {
    if (presentation.type !== "success") return;
    markContextualStepCelebrated(
      organizationId,
      userId,
      presentation.completedStep.id
    );
    setCelebrateVersion((v) => v + 1);
  }, [organizationId, userId, presentation]);

  const refreshAfterAction = useCallback(async () => {
    if (watchedIncompleteRef.current === null) {
      watchedIncompleteRef.current = relevantStepIds.filter((id) => {
        const step = status.steps.find((s) => s.id === id);
        return step ? !step.completed : true;
      });
    }
    await reload({ silent: true });
  }, [reload, relevantStepIds, status.steps]);

  return {
    status,
    loading,
    presentation,
    successCopy:
      presentation.type === "success"
        ? CONTEXTUAL_SUCCESS_COPY[presentation.completedStep.id]
        : null,
    dismiss,
    acknowledgeSuccess,
    refreshAfterAction,
    reload,
  };
}
