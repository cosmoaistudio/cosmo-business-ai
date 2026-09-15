import type { SaasLimitResource } from "../types/limits";

export function formatBrl(value: number | null | undefined) {
  if (value == null) return "Sob consulta";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const LIMIT_LABELS: Record<SaasLimitResource, string> = {
  products: "Produtos",
  users: "Usuários",
  stores: "Lojas",
  ordersPerMonth: "Pedidos / mês",
  aiCreditsPerMonth: "IA / mês",
  automations: "Automações",
  contentPieces: "Conteúdo",
  campaigns: "Campanhas",
};
