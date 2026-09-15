import { describe, expect, it, vi } from "vitest";

vi.mock("../../../apps/mobile/src/features/dashboard/repository/dashboard.repository", () => ({
  fetchDashboardRawData: vi.fn().mockResolvedValue({
    organizationId: "org-1",
    salesToday: [
      {
        id: "s1",
        sale_number: 1,
        total: 100,
        created_at: new Date().toISOString(),
        status: "completed",
      },
    ],
    recentSales: [],
    products: [],
    options: [],
    pendingCommands: [],
    automationLogsToday: [],
    desktopAgents: [],
  }),
  subscribeDashboardChanges: vi.fn(() => () => undefined),
}));

import { dashboardService } from "../../../apps/mobile/src/features/dashboard/services/dashboard.service";
import { fetchDashboardRawData } from "../../../apps/mobile/src/features/dashboard/repository/dashboard.repository";

describe("Mobile Dashboard — integração", () => {
  it("getSnapshot agrega dados do repositório", async () => {
    const snapshot = await dashboardService.getSnapshot("org-1");
    expect(fetchDashboardRawData).toHaveBeenCalledWith("org-1");
    expect(snapshot).toBeDefined();
    expect(snapshot.metrics.revenueToday).toBe(100);
  });

  it("subscribe registra callback de mudanças", () => {
    const onChange = vi.fn();
    const unsubscribe = dashboardService.subscribe("org-1", onChange);
    expect(typeof unsubscribe).toBe("function");
  });
});
