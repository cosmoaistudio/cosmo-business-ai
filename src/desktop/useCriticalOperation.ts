import { useEffect } from "react";
import {
  beginCriticalOperation,
  endCriticalOperation,
} from "./criticalOperation";

export function useCriticalOperation(
  id: string,
  active: boolean,
  reason?: string
) {
  useEffect(() => {
    if (!id) return;
    if (active) {
      beginCriticalOperation(id, reason);
    } else {
      endCriticalOperation(id);
    }
    return () => endCriticalOperation(id);
  }, [id, active, reason]);
}
