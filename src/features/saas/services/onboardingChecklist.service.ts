import type { SaasOnboardingStep } from "../types/onboardingChecklist";

const STORAGE_KEY = "cosmo:saas:onboarding-checklist";

const DEFAULT_STEPS: Omit<SaasOnboardingStep, "done">[] = [
  {
    id: "signup",
    label: "Cadastro",
    description: "Conta criada e autenticação ativa.",
  },
  {
    id: "company",
    label: "Empresa",
    description: "Dados da empresa configurados no onboarding inicial.",
    href: "/",
  },
  {
    id: "products",
    label: "Produtos",
    description: "Catálogo com ao menos um produto.",
    href: "/produtos",
  },
  {
    id: "pdv",
    label: "PDV",
    description: "PDV aberto e pronto para vender.",
    href: "/pdv",
  },
  {
    id: "digital_order",
    label: "Pedido Digital",
    description: "Loja digital / QR configurado.",
    href: "/configuracoes/pedido-digital",
  },
  {
    id: "printing",
    label: "Impressão",
    description: "Impressora / Desktop Agent preparado.",
    href: "/diagnostico",
  },
  {
    id: "first_order",
    label: "Primeiro pedido",
    description: "Primeira venda ou pedido registrado.",
    href: "/pedidos",
  },
  {
    id: "first_customer",
    label: "Primeiro cliente",
    description: "Cliente cadastrado na base.",
    href: "/clientes",
  },
];

function readDone(organizationId: string | null): Record<string, boolean> {
  if (!organizationId || typeof localStorage === "undefined") {
    return { signup: true };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${organizationId}`);
    if (!raw) return { signup: true };
    return { signup: true, ...JSON.parse(raw) };
  } catch {
    return { signup: true };
  }
}

export const onboardingChecklistService = {
  async getChecklist(organizationId: string | null): Promise<SaasOnboardingStep[]> {
    const doneMap = readDone(organizationId);
    return DEFAULT_STEPS.map((step) => ({
      ...step,
      done: Boolean(doneMap[step.id]),
    }));
  },

  async toggleStep(
    organizationId: string | null,
    stepId: string,
    done: boolean
  ): Promise<SaasOnboardingStep[]> {
    const doneMap = readDone(organizationId);
    doneMap[stepId] = done;
    if (organizationId && typeof localStorage !== "undefined") {
      localStorage.setItem(
        `${STORAGE_KEY}:${organizationId}`,
        JSON.stringify(doneMap)
      );
    }
    return this.getChecklist(organizationId);
  },
};
