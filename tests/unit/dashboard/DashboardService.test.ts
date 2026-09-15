import { describe, expect, it, vi } from "vitest";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";

vi.mock("@/features/dashboard/repository/dashboard.repository", () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    totalSales: 10,
    totalRevenue: 1500,
    totalCustomers: 5,
    newCustomersToday: 1,
    lowStockCount: 2,
    topProducts: [],
    recentSales: [],
    financialSummary: { income: 1500, expense: 300, balance: 1200 },
  }),
}));

import { getDashboardStats } from "@/features/dashboard/repository/dashboard.repository";

describe("DashboardService", () => {
  it("getStats delega ao repositório", async () => {
    const stats = await dashboardService.getStats();
    expect(getDashboardStats).toHaveBeenCalled();
    expect(stats.totalSales).toBe(10);
    expect(stats.totalRevenue).toBe(1500);
  });
});
