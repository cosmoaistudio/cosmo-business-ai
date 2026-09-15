export const REMOTE_COMMANDS = {
  PRINT_ORDER: "PRINT_ORDER",
  REPRINT_ORDER: "REPRINT_ORDER",
  OPEN_DRAWER: "OPEN_DRAWER",
  CLOSE_CASH_REGISTER: "CLOSE_CASH_REGISTER",
  OPEN_CASH_REGISTER: "OPEN_CASH_REGISTER",
  PAUSE_PRODUCT: "PAUSE_PRODUCT",
  ACTIVATE_PRODUCT: "ACTIVATE_PRODUCT",
  PAUSE_OPTION: "PAUSE_OPTION",
  ACTIVATE_OPTION: "ACTIVATE_OPTION",
  UPDATE_STOCK: "UPDATE_STOCK",
  RUN_BACKUP: "RUN_BACKUP",
  RESTART_PRINTER: "RESTART_PRINTER",
} as const;

export type RemoteCommandType =
  (typeof REMOTE_COMMANDS)[keyof typeof REMOTE_COMMANDS];

export const REMOTE_COMMAND_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type RemoteCommandStatus =
  (typeof REMOTE_COMMAND_STATUS)[keyof typeof REMOTE_COMMAND_STATUS];

export const DESKTOP_AGENT_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;

export type DesktopAgentStatus =
  (typeof DESKTOP_AGENT_STATUS)[keyof typeof DESKTOP_AGENT_STATUS];

export const REMOTE_COMMAND_SOURCE = {
  MOBILE: "mobile",
  WEB: "web",
  AUTOMATION: "automation",
  SYSTEM: "system",
} as const;

export type RemoteCommandSource =
  (typeof REMOTE_COMMAND_SOURCE)[keyof typeof REMOTE_COMMAND_SOURCE];

export function isRemoteCommandType(value: string): value is RemoteCommandType {
  return Object.values(REMOTE_COMMANDS).includes(value as RemoteCommandType);
}

export function buildOrganizationChannel(organizationId: string) {
  return `cosmo:org:${organizationId}:remote`;
}

export function buildDesktopAgentChannel(organizationId: string, agentId: string) {
  return `cosmo:org:${organizationId}:agent:${agentId}`;
}

export const REALTIME_BROADCAST_EVENT = "remote-command";
