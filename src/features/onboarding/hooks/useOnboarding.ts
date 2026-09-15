import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import { onboardingService } from "../services/onboarding.service";
import type { OnboardingState, OnboardingStepId } from "../types/onboarding";
import { getOnboardingProgressPercent } from "../utils/onboardingStorage";

const AUTOSAVE_MS = 800;

export function useOnboarding() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const organizationName =
    profile?.organizations?.name ?? profile?.full_name ?? "Minha Empresa";

  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const loaded = onboardingService.load(organizationId, organizationName);
    setState(loaded);
    setLoading(false);
  }, [organizationId, organizationName]);

  const persist = useCallback((next: OnboardingState) => {
    setState(next);
    setSaving(true);

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      onboardingService.save(next);
      setSaving(false);
    }, AUTOSAVE_MS);
  }, []);

  const updateState = useCallback(
    (patch: Partial<OnboardingState>) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const goToStep = useCallback(
    (step: OnboardingStepId) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, currentStep: step };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const nextStep = useCallback(async () => {
    if (!state) return;

    setSaving(true);
    const withEffects = await onboardingService.applyStepEffects(
      state,
      state.currentStep
    );
    const updated = onboardingService.markStepComplete(
      withEffects,
      state.currentStep
    );
    setState(updated);
    setSaving(false);
  }, [state]);

  const prevStep = useCallback(() => {
    if (!state || state.currentStep <= 1) return;
    goToStep((state.currentStep - 1) as OnboardingStepId);
  }, [state, goToStep]);

  const skipOnboarding = useCallback(() => {
    if (!state) return;
    const next: OnboardingState = {
      ...state,
      completedAt: new Date().toISOString(),
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
    onboardingService.save(next);
    setState(next);
  }, [state]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const progressPercent = state ? getOnboardingProgressPercent(state) : 0;

  return {
    state,
    loading,
    saving,
    progressPercent,
    updateState,
    goToStep,
    nextStep,
    prevStep,
    skipOnboarding,
  };
}
