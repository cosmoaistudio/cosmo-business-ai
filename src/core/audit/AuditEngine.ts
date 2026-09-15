import type { DomainEvent } from "../types/events";
import { DomainEvents } from "../types/events";
import type { AuditContext, CreateAuditRecordDTO } from "../types/audit";
import { createAuditLog } from "./audit.repository";

class AuditEngineImpl {
  private context: AuditContext = {};
  private autoAuditEnabled = false;
  private unsubscribe: (() => void) | null = null;

  setContext(context: AuditContext) {
    this.context = context;
  }

  clearContext() {
    this.context = {};
  }

  async record(dto: CreateAuditRecordDTO) {
    try {
      return await createAuditLog(dto, this.context);
    } catch (error) {
      console.error("[AuditEngine] Falha ao registrar auditoria:", error);
      return null;
    }
  }

  enableAutoAudit(subscribe: (handler: (event: DomainEvent) => void) => () => void) {
    if (this.autoAuditEnabled) return;

    this.autoAuditEnabled = true;

    this.unsubscribe = subscribe(async (event) => {
      if (event.type === DomainEvents.DataChanged) return;

      await this.record({
        action: event.type,
        table_name: String(event.payload.entityType ?? event.payload.module ?? "system"),
        record_id: event.payload.entityId ? String(event.payload.entityId) : null,
        after_data: event.payload as Record<string, unknown>,
        metadata: {
          eventId: event.id,
          timestamp: event.timestamp,
          source: event.payload.source ?? "system",
        },
      });
    });
  }

  shutdown() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.autoAuditEnabled = false;
  }
}

export const auditEngine = new AuditEngineImpl();
