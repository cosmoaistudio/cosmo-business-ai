/**
 * Catalog metadata only — does not change engine types or persistence.
 * `live` items map to existing AutomationEngine triggers/actions.
 * `planned` items are architecture placeholders for future connectors.
 */

export type CatalogAvailability = "live" | "planned";

export type CatalogConnectorTarget =
  | "dashboard"
  | "business_brain"
  | "finance"
  | "inventory"
  | "growth_hub"
  | "pdv"
  | "orders"
  | "customers"
  | "notifications"
  | "tasks"
  | "ai"
  | "system";

export interface TriggerCatalogItem {
  id: string;
  /** Engine trigger_type when live; stable catalog key when planned */
  triggerKey: string;
  label: string;
  description: string;
  module: string;
  availability: CatalogAvailability;
  connects: CatalogConnectorTarget[];
  example?: string;
}

export interface ActionCatalogItem {
  id: string;
  /** Engine action type when live; stable catalog key when planned */
  actionKey: string;
  label: string;
  description: string;
  category: string;
  availability: CatalogAvailability;
  connects: CatalogConnectorTarget[];
  example?: string;
}
