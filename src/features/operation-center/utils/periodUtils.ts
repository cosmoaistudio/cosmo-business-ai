import { isToday as isTodayDate } from "@/lib/date";
import type { OperationPeriod } from "../types/operationCenter";

export function getPeriodRange(period: OperationPeriod) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case "yesterday": {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "7days":
      start.setDate(start.getDate() - 6);
      break;
    case "30days":
      start.setDate(start.getDate() - 29);
      break;
    default:
      break;
  }

  return { start, end };
}

export function isWithinPeriod(
  dateString: string,
  period: OperationPeriod
): boolean {
  const date = new Date(dateString);
  const { start, end } = getPeriodRange(period);
  return date >= start && date <= end;
}

export function isToday(dateString: string) {
  return isTodayDate(dateString);
}

export function formatTimelineTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimelineDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
