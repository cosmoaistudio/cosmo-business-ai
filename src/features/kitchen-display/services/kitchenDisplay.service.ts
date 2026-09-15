import { eventBus } from "@/core/event-bus/EventBus";
import { DomainEvents } from "@/core/types/events";
import {
  fetchKitchenTickets,
  syncMissingKitchenTickets,
  updateKitchenTicketPriority,
  updateKitchenTicketStatus,
} from "../repository/kitchenDisplay.repository";
import { emitKitchenAutomationEvent } from "../integrations/automation.adapter";
import { notifyDesktopKitchenUpdate } from "../integrations/desktop.adapter";
import type {
  KitchenPriority,
  KitchenStatus,
  KitchenTicket,
} from "../types/kitchenDisplay.types";
import { KITCHEN_WORKFLOW } from "../types/kitchenDisplay.types";

export const kitchenDisplayService = {
  async loadTickets(organizationId: string): Promise<KitchenTicket[]> {
    try {
      await syncMissingKitchenTickets(organizationId);
    } catch (error) {
      console.warn("[KDS] syncMissingKitchenTickets:", error);
    }

    return fetchKitchenTickets(organizationId);
  },

  getNextStatus(status: KitchenStatus): KitchenStatus | null {
    return KITCHEN_WORKFLOW[status];
  },

  async advanceTicket(ticket: KitchenTicket, assignedTo?: string | null) {
    const nextStatus = this.getNextStatus(ticket.status);
    if (!nextStatus) return ticket;

    await updateKitchenTicketStatus(ticket.id, nextStatus, assignedTo ?? ticket.assignedTo);

    eventBus.publish(DomainEvents.OrderCreated, {
      module: "kitchen-display",
      entityId: ticket.id,
      entityType: "kitchen_ticket",
      saleId: ticket.saleId,
      saleNumber: ticket.saleNumber,
      status: nextStatus,
    });

    if (nextStatus === "delivered") {
      eventBus.publish(DomainEvents.OrderCompleted, {
        module: "kitchen-display",
        entityId: ticket.id,
        entityType: "kitchen_ticket",
        saleId: ticket.saleId,
        saleNumber: ticket.saleNumber,
      });
    }

    emitKitchenAutomationEvent(nextStatus, ticket);
    await notifyDesktopKitchenUpdate(ticket.organizationId, ticket.saleNumber, nextStatus);

    return nextStatus;
  },

  async setPriority(ticketId: string, priority: KitchenPriority) {
    await updateKitchenTicketPriority(ticketId, priority);
  },
};
