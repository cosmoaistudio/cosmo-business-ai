export interface AuditRecord {
  id: string;
  organization_id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateAuditRecordDTO {
  action: string;
  table_name: string;
  record_id?: string | null;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditContext {
  userId?: string | null;
  userEmail?: string | null;
  organizationId?: string | null;
  ipAddress?: string | null;
}
