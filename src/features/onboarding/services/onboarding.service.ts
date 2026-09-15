import { productsService } from "@/features/products";
import { digitalStoreService } from "@/features/digital-ordering/services/digitalStore.service";
import { kitchenSettingsService } from "@/features/kitchen-display/services/kitchenSettings.service";
import type { DigitalStoreTable } from "@/features/digital-ordering/types/digitalStore.types";
import type { OnboardingState, OnboardingStepId } from "../types/onboarding";
import {
  loadOnboardingState,
  saveOnboardingState,
} from "../utils/onboardingStorage";

export const onboardingService = {
  load(organizationId: string, organizationName: string) {
    return loadOnboardingState(organizationId, organizationName);
  },

  save(state: OnboardingState) {
    saveOnboardingState(state);
  },

  markStepComplete(state: OnboardingState, step: OnboardingStepId): OnboardingState {
    const completedSteps = state.completedSteps.includes(step)
      ? state.completedSteps
      : [...state.completedSteps, step].sort((a, b) => a - b);

    const nextStep = Math.min(step + 1, 10) as OnboardingStepId;
    const completedAt =
      completedSteps.length >= 10 ? new Date().toISOString() : state.completedAt;

    const updated: OnboardingState = {
      ...state,
      completedSteps,
      currentStep: step === 10 ? 10 : nextStep,
      completedAt,
    };

    saveOnboardingState(updated);
    return updated;
  },

  async applyStepEffects(
    state: OnboardingState,
    step: OnboardingStepId
  ): Promise<OnboardingState> {
    let next = { ...state };

    if (step === 1 || step === 8) {
      next = await syncDigitalStoreSettings(next);
    }

    if (step === 3 && next.tables.length > 0) {
      const tables: DigitalStoreTable[] = next.tables.map((t) => ({
        id: t.id,
        label: t.label,
        seats: t.seats,
      }));
      await digitalStoreService.saveTables(next.organizationId, tables);
    }

    if (step === 5) {
      next = await createPendingProducts(next);
    }

    if (step === 7) {
      kitchenSettingsService.save({
        ...kitchenSettingsService.load(),
        maxPrepMinutes: next.kitchen.maxPrepMinutes,
        soundEnabled: next.kitchen.soundEnabled,
      });
      next = {
        ...next,
        kitchen: { ...next.kitchen, configured: true },
      };
    }

    if (step === 8) {
      next = {
        ...next,
        digitalMenu: { ...next.digitalMenu, qrGenerated: true },
      };
      next = await syncDigitalStoreSettings(next);
    }

    saveOnboardingState(next);
    return next;
  },
};

async function syncDigitalStoreSettings(state: OnboardingState): Promise<OnboardingState> {
  const settings = await digitalStoreService.loadSettings(
    state.organizationId,
    state.company.companyName
  );

  await digitalStoreService.saveSettings({
    ...settings,
    organizationName: state.company.companyName,
    logoUrl: state.company.logoUrl || null,
    slug: state.digitalMenu.slug,
    theme: {
      ...settings.theme,
      primaryColor: state.company.primaryColor,
      secondaryColor: state.company.secondaryColor,
      accentColor: state.company.primaryColor,
    },
    welcomeMessage: `Bem-vindo à ${state.company.companyName}! Faça seu pedido pelo celular.`,
    publishedAt: settings.publishedAt ?? new Date().toISOString(),
  });

  return state;
}

async function createPendingProducts(
  state: OnboardingState
): Promise<OnboardingState> {
  const products = [...state.products];

  for (let i = 0; i < products.length; i++) {
    const draft = products[i];
    if (draft.created || !draft.name.trim()) continue;

    try {
      await productsService.create({
        name: draft.name.trim(),
        category: draft.category || "Geral",
        description: "",
        price: draft.price,
        stock: 100,
        min_stock: 5,
        status: "active",
      });
      products[i] = { ...draft, created: true };
    } catch (error) {
      console.warn("Onboarding product create failed:", error);
    }
  }

  return { ...state, products };
}
