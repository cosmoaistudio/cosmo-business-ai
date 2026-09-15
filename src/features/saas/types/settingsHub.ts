export const SETTINGS_HUB_SECTIONS = [
  "account",
  "company",
  "team",
  "integrations",
  "hardware",
  "subscription",
  "system",
] as const;

export type SettingsHubSectionId = (typeof SETTINGS_HUB_SECTIONS)[number];
