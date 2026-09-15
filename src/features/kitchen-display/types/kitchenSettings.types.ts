import type { KitchenPriority } from "./kitchenDisplay.types";

export interface KitchenDisplaySettings {
  soundEnabled: boolean;
  soundVolume: number;
  priorityColors: Record<KitchenPriority, string>;
  maxPrepMinutes: number;
  autoRefreshSeconds: number;
  fullscreen: boolean;
  touchMode: boolean;
}

export const DEFAULT_KITCHEN_SETTINGS: KitchenDisplaySettings = {
  soundEnabled: true,
  soundVolume: 0.7,
  priorityColors: {
    low: "#94a3b8",
    normal: "#64748b",
    high: "#f59e0b",
    urgent: "#ef4444",
  },
  maxPrepMinutes: 20,
  autoRefreshSeconds: 15,
  fullscreen: false,
  touchMode: true,
};

export const KITCHEN_SETTINGS_STORAGE_KEY = "cosmo:kitchen-display:settings";
