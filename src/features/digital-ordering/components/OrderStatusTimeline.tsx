import { Check } from "lucide-react";
import {
  DIGITAL_ORDER_STATUS_LABELS,
  type DigitalOrderStatusStep,
} from "../types/digitalOrdering.types";
import { getTimelineProgress, ORDER_TIMELINE_STEPS } from "../utils/orderTimeline";

interface OrderStatusTimelineProps {
  currentStatus: DigitalOrderStatusStep;
}

export default function OrderStatusTimeline({
  currentStatus,
}: OrderStatusTimelineProps) {
  const steps = getTimelineProgress(currentStatus);

  return (
    <ol className="space-y-4">
      {ORDER_TIMELINE_STEPS.map((step) => {
        const entry = steps.find((item) => item.step === step);
        const completed = entry?.completed ?? false;
        const active = entry?.active ?? false;

        return (
          <li key={step} className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                completed
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-white/20 bg-white/5 text-slate-400"
              } ${active ? "ring-2 ring-emerald-300/40" : ""}`}
            >
              {completed ? <Check className="h-5 w-5" /> : null}
            </div>
            <div>
              <p
                className={`font-semibold ${
                  active ? "text-white" : completed ? "text-slate-200" : "text-slate-500"
                }`}
              >
                {DIGITAL_ORDER_STATUS_LABELS[step]}
              </p>
              {active && (
                <p className="text-sm text-emerald-300">Status atual do pedido</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
