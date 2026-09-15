import { supabase } from "@/config/supabase";
import type { AuditRecord, CreateAuditRecordDTO } from "../types/audit";
import type { AuditContext } from "../types/audit";

export async function createAuditLog(
  dto: CreateAuditRecordDTO,
  context: AuditContext = {}
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      user_id: context.userId ?? null,
      user_email: context.userEmail ?? null,
      action: dto.action,
      table_name: dto.table_name,
      record_id: dto.record_id ?? null,
      before_data: dto.before_data ?? null,
      after_data: dto.after_data ?? null,
      ip_address: dto.ip_address ?? context.ipAddress ?? null,
      metadata: dto.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as AuditRecord;
}

export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AuditRecord[];
}
