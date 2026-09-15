import type { KitchenTicket } from "../types/kitchenDisplay.types";

export function getElapsedMinutes(ticket: KitchenTicket, now = Date.now()) {
  const start = new Date(ticket.createdAt).getTime();
  return Math.max(0, Math.floor((now - start) / 60000));
}

export function formatElapsed(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${rest}min`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isTicketOverdue(ticket: KitchenTicket, maxPrepMinutes: number) {
  if (ticket.status === "delivered") return false;
  return getElapsedMinutes(ticket) > maxPrepMinutes;
}

export function computeAveragePrepMinutes(tickets: KitchenTicket[]) {
  const completed = tickets.filter(
    (ticket) => ticket.status === "delivered" && ticket.completedAt
  );

  if (completed.length === 0) return 0;

  const total = completed.reduce((sum, ticket) => {
    const start = new Date(ticket.startedAt ?? ticket.createdAt).getTime();
    const end = new Date(ticket.completedAt!).getTime();
    return sum + Math.max(0, (end - start) / 60000);
  }, 0);

  return Math.round(total / completed.length);
}
