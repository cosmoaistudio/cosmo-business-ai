import type { OperationCenterFilters } from "../types/operationCenter";
import { fetchOperationCenterRawData } from "../repository/operationCenter.repository";
import { buildOperationCenterData } from "../utils/operationAggregations";
import type { TimelineEvent } from "../types/operationCenter";

export const operationCenterService = {
  async getData(
    filters: OperationCenterFilters = { period: "today" },
    options?: { realtimeConnected?: boolean; liveTimeline?: TimelineEvent[] }
  ) {
    const raw = await fetchOperationCenterRawData(filters.organizationId);
    return buildOperationCenterData(raw, filters, options);
  },
};
