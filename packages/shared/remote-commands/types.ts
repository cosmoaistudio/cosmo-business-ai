import type { RemoteCommandType } from "./channels.js";

export interface RemoteCommandRecord {
  id: string;
  organization_id: string;
  command: RemoteCommandType;
  payload: Record<string, unknown>;
  status: string;
  source: string;
  requested_by: string | null;
  desktop_agent_id: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
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

export interface DispatchRemoteCommandInput {
  organizationId: string;
  command: RemoteCommandType;
  payload?: Record<string, unknown>;
  source?: string;
  expiresInMinutes?: number;
}

export interface PrintOrderPayload {
  orderId?: string;
  saleId?: string;
  saleNumber?: number;
  lines?: string[];
  title?: string;
}

export interface ReprintOrderPayload {
  orderId?: string;
  saleId?: string;
  saleNumber?: number;
}

export interface ProductCommandPayload {
  productId: string;
}

export interface OptionCommandPayload {
  optionId: string;
}

export interface UpdateStockPayload {
  productId?: string;
  optionId?: string;
  quantity: number;
  movementType?: "in" | "out" | "adjustment";
  reason?: string;
}

export interface CashRegisterPayload {
  sessionId?: string;
  openingBalance?: number;
  closingBalance?: number;
  notes?: string;
}

export interface RestartPrinterPayload {
  flushQueue?: boolean;
}
