// Event Bus
export { eventBus } from "./event-bus/EventBus";
export type { DomainEvent, DomainEventPayload, DomainEventType } from "./event-bus/EventBus";

// Domain events
export {
  DomainEvents,
  LEGACY_AUTOMATION_EVENT_TYPES,
  LEGACY_TRIGGER_TO_DOMAIN,
  DOMAIN_TO_LEGACY_TRIGGER,
  legacyToDomainEvent,
  domainToLegacyTrigger,
} from "./types/events";
export type {
  LegacyAutomationEventType,
} from "./types/events";

// Engines
export { automationEngine } from "./automation/AutomationEngine";
export { notificationEngine } from "./notification/NotificationEngine";
export { auditEngine } from "./audit/AuditEngine";
export { featureFlagEngine } from "./feature-flags/FeatureFlagEngine";
export { permissionEngine } from "./permission/PermissionEngine";

// Types
export type { CosmoRole, Permission, ActiveCosmoRole, AppRoute } from "./types/permissions";
export {
  CosmoRoles,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTE_BY_ROLE,
} from "./types/permissions";

export type { FeatureModule, OrganizationFeatureFlag } from "./types/featureFlags";
export {
  FeatureModules,
  FEATURE_MODULE_LABELS,
  DEFAULT_ENABLED_MODULES,
} from "./types/featureFlags";

export type {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from "./types/notifications";
export { NotificationChannels } from "./types/notifications";

export type {
  AuditRecord,
  CreateAuditRecordDTO,
  AuditContext,
} from "./types/audit";

// Provider
export { CoreProvider } from "./CoreProvider";

// Repositories (infra — uso interno ou admin futuro)
export { createAuditLog, getAuditLogs } from "./audit/audit.repository";
export {
  getOrganizationFeatureFlags,
  upsertFeatureFlag,
} from "./feature-flags/featureFlags.repository";
