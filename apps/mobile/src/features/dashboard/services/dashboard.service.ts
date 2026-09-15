import {
  fetchDashboardRawData,
  subscribeDashboardChanges,
} from "../repository/dashboard.repository";
import type { MobileDashboardSnapshot } from "../types/dashboard.types";
import { buildDashboardSnapshot } from "../utils/dashboardAggregations";

export class DashboardService {
  async getSnapshot(organizationId: string): Promise<MobileDashboardSnapshot> {
    const raw = await fetchDashboardRawData(organizationId);
    return buildDashboardSnapshot(raw);
  }

  subscribe(organizationId: string, onChange: () => void) {
    return subscribeDashboardChanges(organizationId, onChange);
  }
}

export const dashboardService = new DashboardService();
