/**
 * Canonical definitions also live in packages/shared/remote-commands.
 * Keep this Electron copy in sync until the desktop tsconfig can import
 * the shared package without expanding rootDir.
 */
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

export const DESKTOP_AGENT_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;

export const REALTIME_BROADCAST_EVENT = "remote-command";

export function buildOrganizationChannel(organizationId: string) {
  return `cosmo:org:${organizationId}:remote`;
}

export interface RemoteCommandRecord {
  id: string;
  organization_id: string;
  command: RemoteCommandType;
  payload: Record<string, unknown>;
  status: string;
  source: string;
  priority: number;
  target: string | null;
  created_by: string | null;
  requested_by: string | null;
  agent_id: string | null;
  desktop_agent_id: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  processed_at: string | null;
  acknowledged_at: string | null;
  expires_at: string | null;
}

export interface DesktopAgentRecord {
  id: string;
  organization_id: string;
  device_name: string;
  machine_id: string;
  status: string;
  last_seen_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RemoteCommandResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
