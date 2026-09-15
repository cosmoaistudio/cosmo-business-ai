export type GrowthNiche =
  | "restaurante"
  | "pizzaria"
  | "hamburgueria"
  | "acai"
  | "sorveteria"
  | "barbearia"
  | "salao"
  | "clinica"
  | "dentista"
  | "pet_shop"
  | "academia"
  | "loja"
  | "mercado"
  | "padaria"
  | "farmacia"
  | "imobiliaria"
  | "advogado"
  | "personal"
  | "criador_conteudo"
  | "outro";

export type GrowthSocialNetwork =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "pinterest"
  | "whatsapp";

export type GrowthContentObjective =
  | "atrair"
  | "engajar"
  | "converter"
  | "retencao"
  | "autoridade"
  | "promocao";

export type GrowthCalendarView = "month" | "week" | "list" | "cards";

export type GrowthContentStatus =
  | "idea"
  | "draft"
  | "scheduled"
  | "published"
  | "archived";

export type PaidTrafficPlatform = "meta_ads" | "google_ads" | "tiktok_ads";

export type GrowthCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "completed";

export type GrowthAiAssetType =
  | "roteiro"
  | "legenda"
  | "hashtags"
  | "oferta"
  | "criativo";

/** Input contract for unlimited idea generation (AI wired later). */
export interface IdeaGenerationRequest {
  niche: GrowthNiche;
  theme: string;
  objective: GrowthContentObjective;
  network: GrowthSocialNetwork;
  quantity: number;
}

export interface GrowthIdea {
  id: string;
  title: string;
  hook: string;
  niche: GrowthNiche;
  theme: string;
  objective: GrowthContentObjective;
  network: GrowthSocialNetwork;
  status: "ready" | "used" | "archived";
  createdAt: string;
  source: "manual" | "ai_pending";
}

export interface EditorialCalendarItem {
  id: string;
  title: string;
  network: GrowthSocialNetwork;
  status: GrowthContentStatus;
  scheduledAt: string;
  campaignId?: string;
}

export interface GrowthContentItem {
  id: string;
  title: string;
  network: GrowthSocialNetwork;
  status: GrowthContentStatus;
  format: string;
  updatedAt: string;
}

export interface GrowthCampaign {
  id: string;
  name: string;
  objective: GrowthContentObjective;
  status: GrowthCampaignStatus;
  networks: GrowthSocialNetwork[];
  startDate?: string;
  endDate?: string;
}

export interface PaidTrafficChannel {
  id: PaidTrafficPlatform;
  name: string;
  description: string;
  status: "ready" | "coming_soon";
  metricsPlaceholder: {
    spend: string;
    clicks: string;
    roas: string;
  };
}

export interface GrowthMetricCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "neutral" | "good" | "warn";
}

export interface GrowthAutomationStub {
  id: string;
  title: string;
  description: string;
  status: "planned" | "ready_soon";
}

export interface GrowthAiPanelSlot {
  id: GrowthAiAssetType;
  title: string;
  description: string;
}

export type GrowthHubSectionId =
  | "overview"
  | "calendar"
  | "ideas"
  | "content"
  | "campaigns"
  | "traffic"
  | "metrics"
  | "automations"
  | "ai";

export interface GrowthHubSnapshot {
  ideas: GrowthIdea[];
  calendar: EditorialCalendarItem[];
  content: GrowthContentItem[];
  campaigns: GrowthCampaign[];
  traffic: PaidTrafficChannel[];
  metrics: GrowthMetricCard[];
  automations: GrowthAutomationStub[];
  aiSlots: GrowthAiPanelSlot[];
}
