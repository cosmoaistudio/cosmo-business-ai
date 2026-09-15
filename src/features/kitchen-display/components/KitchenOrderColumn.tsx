import { AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import {
  KITCHEN_COLUMN_LABELS,
  KITCHEN_COLUMN_STATUSES,
  type KitchenColumn,
  type KitchenTicket,
} from "../types/kitchenDisplay.types";
import KitchenOrderCard from "./KitchenOrderCard";
import type { KitchenDisplaySettings } from "../types/kitchenSettings.types";

interface KitchenOrderColumnProps {
  column: KitchenColumn;
  tickets: KitchenTicket[];
  settings: KitchenDisplaySettings;
  newTicketIds: Set<string>;
  onAdvance: (ticket: KitchenTicket) => void;
  headerExtra?: ReactNode;
}

export default function KitchenOrderColumn({
  column,
  tickets,
  settings,
  newTicketIds,
  onAdvance,
  headerExtra,
}: KitchenOrderColumnProps) {
  const statuses = KITCHEN_COLUMN_STATUSES[column];
  const columnTickets = tickets.filter((ticket) => statuses.includes(ticket.status));

  return (
    <section className="flex min-h-[70vh] flex-col rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {KITCHEN_COLUMN_LABELS[column]}
          </h2>
          <p className="text-sm text-slate-500">{columnTickets.length} pedido(s)</p>
        </div>
        {headerExtra}
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {columnTickets.map((ticket) => (
            <KitchenOrderCard
              key={ticket.id}
              ticket={ticket}
              settings={settings}
              isNew={newTicketIds.has(ticket.id)}
              onAdvance={onAdvance}
            />
          ))}
        </AnimatePresence>

        {columnTickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Nenhum pedido</p>
        ) : null}
      </div>
    </section>
  );
}
