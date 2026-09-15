import type { SaasPlan } from "../types/plans";

export const SAAS_PLANS: SaasPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPriceBrl: 97,
    description: "Para começar a operar com PDV e catálogo essencial.",
    limits: {
      products: 50,
      users: 2,
      stores: 1,
      ordersPerMonth: 500,
      aiCreditsPerMonth: 50,
      automations: 3,
      contentPieces: 10,
      campaigns: 1,
    },
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPriceBrl: 197,
    description: "Operação completa com IA, automações e pedido digital.",
    highlighted: true,
    limits: {
      products: 300,
      users: 8,
      stores: 2,
      ordersPerMonth: 3000,
      aiCreditsPerMonth: 300,
      automations: 20,
      contentPieces: 60,
      campaigns: 5,
    },
  },
  {
    id: "business",
    name: "Business",
    monthlyPriceBrl: 397,
    description: "Multi-loja, Growth Hub e limites ampliados.",
    limits: {
      products: 1500,
      users: 25,
      stores: 5,
      ordersPerMonth: 15000,
      aiCreditsPerMonth: 1500,
      automations: 100,
      contentPieces: 300,
      campaigns: 25,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceBrl: null,
    description: "Limites sob medida, SLA e onboarding dedicado.",
    limits: {
      products: null,
      users: null,
      stores: null,
      ordersPerMonth: null,
      aiCreditsPerMonth: null,
      automations: null,
      contentPieces: null,
      campaigns: null,
    },
  },
];

export function getPlanById(planId: string) {
  return SAAS_PLANS.find((plan) => plan.id === planId);
}
