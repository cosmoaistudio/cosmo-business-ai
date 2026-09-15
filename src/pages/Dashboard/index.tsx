import { useMemo } from "react";
import { OsHero } from "@/features/dashboard/components/os/OsHero";
import { OsPanel } from "@/features/dashboard/components/os/OsPanel";
import { OrganizationIdentityHeader } from "@/features/dashboard/components/OrganizationIdentityHeader";
import DashboardOperationalMetrics from "@/features/dashboard/components/DashboardOperationalMetrics";
import DashboardAttentionSection from "@/features/dashboard/components/DashboardAttentionSection";
import {
  DashboardStockAlerts,
  RecentSalesList,
  RevenueLineChart,
  SalesChart,
  TopProductsChart,
  useDashboardStats,
} from "@/features/dashboard";
import { buildDashboardAttentionAlerts } from "@/features/dashboard/utils/buildDashboardAttentionAlerts";
import "@/features/dashboard/styles/cosmo-os.css";

import { useCosmoAiContext } from "@/features/cosmo-ai";
import {
  OperationSetupGuide,
  useOperationSetup,
} from "@/features/operation-onboarding";
import { getUserDisplayName, useAuth } from "@/features/auth";
import { AnimatedPage, AnimatedSection } from "@/motion";
import { formatCurrency } from "@/lib/format";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { stats, loading, error, reload } = useDashboardStats();
  const { data: aiData } = useCosmoAiContext();
  const { status: operationStatus, loading: operationLoading } =
    useOperationSetup();
  const firstName = getUserDisplayName(user).split(" ")[0] || "Operador";
  const greeting = getGreeting();

  const attentionAlerts = useMemo(
    () =>
      buildDashboardAttentionAlerts({
        stats,
        statsLoading: loading,
        statsError: Boolean(error),
        operationStatus,
        operationLoading,
      }),
    [stats, loading, error, operationStatus, operationLoading]
  );

  const nextAction =
    aiData?.priorities?.[0] ??
    aiData?.recommendations?.[0] ??
    aiData?.insights?.[0] ??
    null;

  return (
    <AnimatedPage className="cosmo-os">
      <AnimatedSection>
        <OrganizationIdentityHeader
          organization={profile?.organizations}
          operationStatus={operationStatus}
          operationLoading={operationLoading}
        />
      </AnimatedSection>

      <AnimatedSection delay={0.04}>
        <DashboardOperationalMetrics
          stats={stats}
          loading={loading}
          error={error}
          onRetry={reload}
        />
      </AnimatedSection>

      {attentionAlerts.length > 0 && (
        <AnimatedSection delay={0.05}>
          <DashboardAttentionSection alerts={attentionAlerts} />
        </AnimatedSection>
      )}

      <AnimatedSection delay={0.06}>
        <OperationSetupGuide
          status={operationStatus}
          loading={operationLoading}
        />
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <OsHero
          firstName={firstName}
          greeting={greeting}
          stats={stats}
          healthIndex={aiData?.healthIndex ?? null}
          nextAction={nextAction}
          loading={loading}
        />
      </AnimatedSection>

      <div className="cosmo-os-main">
        <div className="cosmo-os-stack">
          <AnimatedSection delay={0.1}>
            <RevenueLineChart data={stats.salesByDay} loading={loading} />
          </AnimatedSection>
          <AnimatedSection delay={0.12}>
            <SalesChart data={stats.salesByDay} loading={loading} />
          </AnimatedSection>
        </div>

        <div className="cosmo-os-stack">
          <AnimatedSection delay={0.1}>
            <OsPanel
              title="Produtos em destaque"
              description="Volume e receita dos mais vendidos."
            >
              <TopProductsChart
                products={stats.topSellingProducts}
                loading={loading}
                embedded
              />
            </OsPanel>
          </AnimatedSection>

          <AnimatedSection delay={0.12}>
            <OsPanel
              title="Fluxo recente"
              description={`${stats.recentSales.length} vendas recentes · ${formatCurrency(stats.weekRevenue)} na semana`}
            >
              <RecentSalesList
                sales={stats.recentSales}
                loading={loading}
                embedded
              />
            </OsPanel>
          </AnimatedSection>

          <AnimatedSection delay={0.14}>
            <OsPanel
              title="Alertas de estoque"
              description="Itens que exigem reposição."
            >
              <DashboardStockAlerts
                alerts={stats.stockAlerts}
                loading={loading}
                embedded
              />
            </OsPanel>
          </AnimatedSection>
        </div>
      </div>
    </AnimatedPage>
  );
}
