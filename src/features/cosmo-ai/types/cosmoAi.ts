export type InsightCategory =
  | "operation"
  | "finance"
  | "stock"
  | "marketing"
  | "team"
  | "products"
  | "customers";

export type InsightType =
  | "information"
  | "suggestion"
  | "opportunity"
  | "alert"
  | "urgent";

export type InsightStatus = "active" | "resolved" | "ignored";

export type InsightSource =
  | "sales"
  | "orders"
  | "stock"
  | "kitchen"
  | "desktop"
  | "mobile"
  | "delivery"
  | "finance"
  | "customers"
  | "automation"
  | "system";

export interface InsightScore {
  impact: number;
  urgency: number;
  confidence: number;
  priority: number;
}

export interface CosmoInsight {
  id: string;
  category: InsightCategory;
  type: InsightType;
  source: InsightSource;
  title: string;
  message: string;
  score: InsightScore;
  status: InsightStatus;
  actionLabel?: string;
  href?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  resolvedAt?: string;
  ignoredAt?: string;
}

export interface CosmoRecommendation {
  id: string;
  insightId: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  priority: "high" | "medium" | "low";
  category: InsightCategory;
}

export interface CosmoForecast {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  predictedAt?: string;
  confidence: number;
  valueLabel?: string;
}

export interface CosmoAnomaly {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  deviationPercent: number;
  severity: "low" | "medium" | "high";
  detectedAt: string;
}

export interface CosmoTask {
  id: string;
  insightId: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
  href?: string;
  createdAt: string;
}

export type AiTimelineEventType =
  | "insight_created"
  | "insight_resolved"
  | "insight_ignored";

export interface AiTimelineEvent {
  id: string;
  type: AiTimelineEventType;
  insightId: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface CosmoAiPanelData {
  priorities: CosmoInsight[];
  insights: CosmoInsight[];
  alerts: CosmoInsight[];
  recommendations: CosmoRecommendation[];
  forecasts: CosmoForecast[];
  anomalies: CosmoAnomaly[];
  tasks: CosmoTask[];
  timeline: AiTimelineEvent[];
  lastAnalysisAt: string;
  healthIndex: number;
}

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  operation: "Operação",
  finance: "Financeiro",
  stock: "Estoque",
  marketing: "Marketing",
  team: "Equipe",
  products: "Produtos",
  customers: "Clientes",
};

export const INSIGHT_TYPE_LABELS: Record<InsightType, string> = {
  information: "Informação",
  suggestion: "Sugestão",
  opportunity: "Oportunidade",
  alert: "Alerta",
  urgent: "Urgente",
};

export const INSIGHT_SOURCE_LABELS: Record<InsightSource, string> = {
  sales: "Vendas",
  orders: "Pedidos",
  stock: "Estoque",
  kitchen: "Kitchen",
  desktop: "Desktop",
  mobile: "Mobile",
  delivery: "Delivery",
  finance: "Financeiro",
  customers: "Clientes",
  automation: "Automação",
  system: "Sistema",
};
