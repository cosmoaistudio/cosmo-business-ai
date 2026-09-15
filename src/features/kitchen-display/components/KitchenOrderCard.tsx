import { motion } from "framer-motion";
import {
  KITCHEN_PRIORITY_LABELS,
  KITCHEN_TICKET_TYPE_LABELS,
  KITCHEN_STATUS_LABELS,
  KITCHEN_WORKFLOW,
  type KitchenTicket,
} from "../types/kitchenDisplay.types";
import type { KitchenDisplaySettings } from "../types/kitchenSettings.types";
import { formatElapsed, formatTime, getElapsedMinutes, isTicketOverdue } from "../utils/kitchenTime";

interface KitchenOrderCardProps {
  ticket: KitchenTicket;
  settings: KitchenDisplaySettings;
  isNew?: boolean;
  onAdvance: (ticket: KitchenTicket) => void;
}

export default function KitchenOrderCard({
  ticket,
  settings,
  isNew = false,
  onAdvance,
}: KitchenOrderCardProps) {
  const elapsed = getElapsedMinutes(ticket);
  const overdue = isTicketOverdue(ticket, settings.maxPrepMinutes);
  const nextStatus = KITCHEN_WORKFLOW[ticket.status];
  const priorityColor = settings.priorityColors[ticket.priority];

  return (
    <motion.article
      layout
      initial={isNew ? { opacity: 0, scale: 0.92, y: 16 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${
        overdue ? "border-red-400" : "border-slate-200"
      }`}
      style={{ borderLeftWidth: 6, borderLeftColor: priorityColor }}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-black text-slate-900">#{ticket.saleNumber}</p>
          <p className="text-sm font-medium text-slate-600">
            {ticket.customerName ?? "Cliente balcão"}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{formatTime(ticket.createdAt)}</p>
          <p className={overdue ? "font-bold text-red-600" : ""}>
            {formatElapsed(elapsed)}
          </p>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
          {KITCHEN_TICKET_TYPE_LABELS[ticket.ticketType]}
        </span>
        <span
          className="rounded-full px-2 py-1 font-semibold text-white"
          style={{ backgroundColor: priorityColor }}
        >
          {KITCHEN_PRIORITY_LABELS[ticket.priority]}
        </span>
        <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
          {KITCHEN_STATUS_LABELS[ticket.status]}
        </span>
      </div>

      <ul className="mb-3 space-y-2 text-sm text-slate-800">
        {ticket.items.map((item) => (
          <li key={item.id}>
            <p className="font-semibold">
              {item.quantity}x {item.productName}
            </p>
            {item.summary ? (
              <p className="ml-1 text-xs text-slate-600">+ {item.summary}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {ticket.notes?.trim() ? (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {ticket.notes.trim()}
        </p>
      ) : null}

      {ticket.assignedTo ? (
        <p className="mb-3 text-xs text-slate-500">Resp.: {ticket.assignedTo}</p>
      ) : null}

      {nextStatus && settings.touchMode ? (
        <button
          type="button"
          onClick={() => onAdvance(ticket)}
          className="min-h-14 w-full rounded-xl bg-blue-600 text-lg font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
        >
          → {KITCHEN_STATUS_LABELS[nextStatus]}
        </button>
      ) : null}
    </motion.article>
  );
}
