export type OperationSetupStepId =
  | "first_product"
  | "addons"
  | "menu"
  | "digital_order"
  | "first_sale";

export type OperationSetupStepVisualState =
  | "completed"
  | "current"
  | "upcoming";

export interface OperationSetupStepMeta {
  id: OperationSetupStepId;
  order: number;
  title: string;
  description: string;
  tip: string;
  ctaLabel: string;
  href: string;
  educationSteps: string[];
  shortLabel: string;
}

export interface OperationSetupStep {
  id: OperationSetupStepId;
  title: string;
  description: string;
  tip: string;
  ctaLabel: string;
  href: string;
  educationSteps: string[];
  shortLabel: string;
  completed: boolean;
  /** Visual only — never blocks real app routes/permissions */
  visualState: OperationSetupStepVisualState;
  order: number;
}

export interface OperationSetupStatus {
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  allComplete: boolean;
  steps: OperationSetupStep[];
  nextStep: OperationSetupStep | null;
  otherSteps: OperationSetupStep[];
}

/**
 * Raw signals from DB. Keep granular so completion rules stay explicit.
 */
export interface OperationSetupSignals {
  /** At least one active product with non-empty category */
  hasFirstProductReady: boolean;
  /** Active product exists but category may be missing (does NOT complete first_product) */
  hasActiveProductWithoutCategory: boolean;
  hasAddonGroup: boolean;
  /** Catalog review-ready: same readiness as first product (no fake "reviewed" flag) */
  hasMenuReady: boolean;
  hasDigitalOrderConfigured: boolean;
  hasFirstSale: boolean;
}

export const OPERATION_SETUP_STEPS: readonly OperationSetupStepMeta[] = [
  {
    id: "first_product",
    order: 1,
    title: "Cadastre seu primeiro produto",
    description:
      "Adicione um produto e informe nome, preço e categoria. Exemplos de categorias: Açaí, Bebidas, Combos e Sobremesas.",
    tip: "Ao cadastrar seu produto, escolha ou informe a categoria que ele pertence.",
    ctaLabel: "Criar produto",
    href: "/produtos",
    shortLabel: "Primeiro produto",
    educationSteps: [
      'Clique em "Criar produto"',
      "Informe o nome do produto",
      "Escolha ou informe uma categoria",
      "Defina o preço",
      "Salve para adicionar ao cardápio",
    ],
  },
  {
    id: "addons",
    order: 2,
    title: "Crie opções e adicionais",
    description:
      "Ofereça opções para personalizar os pedidos, como leite em pó, Nutella, frutas, coberturas e outros complementos.",
    tip: "Grupos de adicionais deixam o PDV e o pedido digital mais flexíveis.",
    ctaLabel: "Criar adicionais",
    href: "/opcoes/grupos",
    shortLabel: "Opções e adicionais",
    educationSteps: [
      "Crie um grupo de opções (ex.: Coberturas)",
      "Adicione itens ao grupo",
      "Defina preços adicionais, se necessário",
    ],
  },
  {
    id: "menu",
    order: 3,
    title: "Confira seu cardápio",
    description:
      "Verifique se seus produtos estão organizados corretamente e prontos para serem vendidos.",
    tip: "Revise nomes, preços e categorias antes de ativar o pedido digital.",
    ctaLabel: "Ver meus produtos",
    href: "/produtos",
    shortLabel: "Cardápio",
    educationSteps: [
      "Abra a lista de produtos",
      "Confira categorias e preços",
      "Ajuste o que estiver incompleto",
    ],
  },
  {
    id: "digital_order",
    order: 4,
    title: "Ative seu pedido digital",
    description:
      "Publique seu cardápio para que os clientes possam fazer pedidos online.",
    tip: "Publique o catálogo para liberar o QR Code e o cardápio digital.",
    ctaLabel: "Configurar pedido digital",
    href: "/configuracoes/pedido-digital",
    shortLabel: "Pedido digital",
    educationSteps: [
      "Abra as configurações de pedido digital",
      "Revise o slug e as opções da loja",
      "Publique o cardápio para gerar o acesso digital",
    ],
  },
  {
    id: "first_sale",
    order: 5,
    title: "Faça sua primeira venda",
    description:
      "Abra o PDV e registre sua primeira venda para começar sua operação.",
    tip: "Uma venda concluída valida que o fluxo operacional está funcionando.",
    ctaLabel: "Abrir PDV",
    href: "/pdv",
    shortLabel: "Primeira venda",
    educationSteps: [
      "Abra o PDV",
      "Adicione um produto ao carrinho",
      "Finalize a venda",
    ],
  },
] as const;

/** @deprecated Use OPERATION_SETUP_STEPS */
export const OPERATION_SETUP_STEP_META = Object.fromEntries(
  OPERATION_SETUP_STEPS.map((step) => [step.id, step])
) as Record<OperationSetupStepId, OperationSetupStepMeta>;
