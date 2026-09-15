export * from "./hooks/useCosmoAi";
export {
  CosmoAiProvider,
  useCosmoAiContext,
} from "./context/CosmoAiProvider";
export * from "./services/cosmoAi.service";
export type * from "./types/cosmoAi";
export type * from "./types/analysisContext";
export {
  INSIGHT_CATEGORY_LABELS,
  INSIGHT_TYPE_LABELS,
  INSIGHT_SOURCE_LABELS,
} from "./types/cosmoAi";

export type { ILLMProvider, IWeatherProvider } from "./interfaces/llm";

export { aiEngine } from "./engines/AIEngine";
export { insightEngine } from "./engines/InsightEngine";
export { recommendationEngine } from "./engines/RecommendationEngine";
export { forecastEngine } from "./engines/ForecastEngine";
export { anomalyEngine } from "./engines/AnomalyEngine";
export { cosmoNotificationEngine } from "./engines/NotificationEngine";
export { taskEngine } from "./engines/TaskEngine";

export { default as CosmoAiPanel } from "./components/CosmoAiPanel";
export { default as InsightCard } from "./components/InsightCard";
export { default as InsightScoreBadge } from "./components/InsightScoreBadge";
export { default as PriorityList } from "./components/PriorityList";
export { default as AiTimeline } from "./components/AiTimeline";

export * from "./integrations/dashboard.adapter";
export * from "./integrations/operationCenter.adapter";
export * from "./integrations/kitchen.adapter";
export * from "./integrations/desktop.adapter";
export * from "./integrations/mobile.adapter";
export * from "./integrations/automation.adapter";
export * from "./integrations/productEngine.adapter";
export * from "./integrations/pdv.adapter";
