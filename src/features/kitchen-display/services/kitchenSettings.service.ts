import {
  DEFAULT_KITCHEN_SETTINGS,
  KITCHEN_SETTINGS_STORAGE_KEY,
  type KitchenDisplaySettings,
} from "../types/kitchenSettings.types";

export const kitchenSettingsService = {
  load(): KitchenDisplaySettings {
    if (typeof window === "undefined") return DEFAULT_KITCHEN_SETTINGS;

    try {
      const raw = localStorage.getItem(KITCHEN_SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_KITCHEN_SETTINGS;
      return { ...DEFAULT_KITCHEN_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_KITCHEN_SETTINGS;
    }
  },

  save(settings: KitchenDisplaySettings) {
    localStorage.setItem(KITCHEN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  },

  async toggleFullscreen(enabled: boolean) {
    if (enabled && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => undefined);
    } else if (!enabled && document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
  },
};

export function playKitchenNotification(volume: number) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.value = Math.min(Math.max(volume, 0), 1) * 0.25;

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();

  window.setTimeout(() => {
    oscillator.stop();
    void context.close();
  }, 180);
}
