export type HealthLevel = "excellent" | "good" | "attention" | "critical";

export type HealthDomain =
  | "operation"
  | "finance"
  | "orders"
  | "stock"
  | "customers"
  | "marketing"
  | "ai";

export interface DomainHealth {
  id: HealthDomain;
  label: string;
  level: HealthLevel;
  score: number;
  summary: string;
}

export interface SmartSummaryItem {
  id: string;
  text: string;
  tone: "positive" | "neutral" | "warning" | "critical";
}

export type OpportunityKind =
  | "promotion"
  | "restock"
  | "content"
  | "budget"
  | "reactivate";

export interface BrainOpportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export type BrainAlertSeverity = "critical" | "warning" | "info";

export interface BrainAlert {
  id: string;
  title: string;
  description: string;
  severity: BrainAlertSeverity;
  category: "stock" | "finance" | "orders" | "customers" | "margin";
}

export interface InsightComparison {
  id: string;
  label: string;
  currentLabel: string;
  currentValue: string;
  previousLabel: string;
  previousValue: string;
  changePercent: number;
  trend: "up" | "down" | "neutral";
}

export interface BrainGoal {
  id: string;
  label: string;
  current: string;
  target: string;
  progressPercent: number;
  hint: string;
}

export interface MarketingInsight {
  id: string;
  title: string;
  description: string;
  network?: string;
  bestTime?: string;
}

/** Ask-anything architecture — no LLM in V1. */
export interface BrainAskRequest {
  question: string;
  contextKeys?: string[];
}

export interface BrainAskResponse {
  status: "pending_provider" | "ready";
  question: string;
  answerPreview: string;
  provider: string;
}

export interface BrainAskProvider {
  readonly name: string;
  readonly isAvailable: () => boolean;
  ask(request: BrainAskRequest): Promise<BrainAskResponse>;
}

export interface BusinessBrainSnapshot {
  analyzedAt: string;
  overallScore: number;
  overallLevel: HealthLevel;
  domains: DomainHealth[];
  summary: SmartSummaryItem[];
  opportunities: BrainOpportunity[];
  alerts: BrainAlert[];
  insights: InsightComparison[];
  goals: BrainGoal[];
  marketing: MarketingInsight[];
  suggestedQuestions: string[];
}
