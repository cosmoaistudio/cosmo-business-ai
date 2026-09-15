import { ScrollView, Text, View } from "react-native";
import { Badge, Card, MetricCard, Screen, SectionTitle } from "@/components/ui";
import { useOrganizationId } from "@/hooks";
import { useAuthStore } from "@/store/authStore";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardSectionEmpty,
} from "./components/DashboardStateViews";
import { useDashboard } from "./hooks/useDashboard";
import type { DashboardAlertSeverity } from "./types/dashboard.types";
import { formatCurrency, formatDateTime } from "./utils/dashboard.utils";

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Erro desconhecido ao carregar dashboard.";
}

function alertTone(severity: DashboardAlertSeverity) {
  if (severity === "critical") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  return "default" as const;
}

function healthTone(label: "healthy" | "attention" | "critical") {
  if (label === "healthy") return "success" as const;
  if (label === "attention") return "warning" as const;
  return "danger" as const;
}

function healthLabel(label: "healthy" | "attention" | "critical") {
  if (label === "healthy") return "Saudável";
  if (label === "attention") return "Atenção";
  return "Crítico";
}

export function DashboardScreen() {
  const organizationId = useOrganizationId();
  const profileError = useAuthStore((state) => state.profileError);
  const dashboardQuery = useDashboard(organizationId);

  if (!organizationId) {
    return (
      <DashboardErrorState
        title="Organização não encontrada"
        message={
          profileError ??
          "O perfil autenticado não possui organization_id. Verifique o provisionamento no Supabase."
        }
      />
    );
  }

  if (dashboardQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (dashboardQuery.isError) {
    return (
      <DashboardErrorState
        title="Não foi possível carregar o dashboard"
        message={formatError(dashboardQuery.error)}
        details={`organization_id: ${organizationId}`}
      />
    );
  }

  const snapshot = dashboardQuery.data;

  if (!snapshot) {
    return (
      <DashboardEmptyState message="Nenhum dado operacional disponível para esta organização." />
    );
  }

  const { metrics, health, desktopAgents, recentSales, alerts } = snapshot;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle
          title="Centro de Comando"
          subtitle={`Atualizado ${formatDateTime(snapshot.checkedAt)}`}
        />

        <Card className="mt-2 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-cosmo-muted">Saúde da operação</Text>
              <Text className="text-white text-3xl font-bold mt-1">{health.score}%</Text>
            </View>
            <Badge label={healthLabel(health.label)} tone={healthTone(health.label)} />
          </View>
        </Card>

        <View className="flex-row flex-wrap gap-3 mb-4">
          <MetricCard
            label="Faturamento hoje"
            value={formatCurrency(metrics.revenueToday)}
          />
          <MetricCard
            label="Pedidos em aberto"
            value={String(metrics.openOrders)}
            tone={metrics.openOrders > 0 ? "warning" : "default"}
          />
          <MetricCard
            label="Pedidos atrasados"
            value={String(metrics.delayedOrders)}
            tone={metrics.delayedOrders > 0 ? "danger" : "success"}
          />
          <MetricCard
            label="Estoque crítico"
            value={String(metrics.criticalStockCount)}
            tone={metrics.criticalStockCount > 0 ? "danger" : "success"}
          />
          <MetricCard
            label="Automações hoje"
            value={String(metrics.automationsExecutedToday)}
          />
          <MetricCard
            label="Desktop online"
            value={`${metrics.desktopOnline}/${metrics.desktopTotal}`}
            tone={metrics.desktopOnline > 0 ? "success" : "danger"}
          />
          <MetricCard
            label="Produtos pausados"
            value={String(metrics.pausedProducts)}
            tone={metrics.pausedProducts > 0 ? "warning" : "default"}
          />
          <MetricCard
            label="Opções pausadas"
            value={String(metrics.pausedOptions)}
            tone={metrics.pausedOptions > 0 ? "warning" : "default"}
          />
        </View>

        <Card className="mb-4">
          <Text className="text-white font-semibold mb-2">Terminais Desktop</Text>
          {desktopAgents.length === 0 ? (
            <DashboardSectionEmpty message="Nenhum agente desktop registrado." />
          ) : (
            desktopAgents.map((agent) => (
              <View
                key={agent.id}
                className="flex-row items-center justify-between py-2 border-b border-slate-700/40"
              >
                <Text className="text-white">{agent.device_name}</Text>
                <Badge
                  label={agent.status === "online" ? "Online" : "Offline"}
                  tone={agent.status === "online" ? "success" : "danger"}
                />
              </View>
            ))
          )}
        </Card>

        <Card className="mb-4">
          <Text className="text-white font-semibold mb-2">Últimas vendas</Text>
          {recentSales.length === 0 ? (
            <DashboardSectionEmpty message="Nenhuma venda concluída registrada." />
          ) : (
            recentSales.map((sale) => (
              <View
                key={sale.id}
                className="flex-row items-center justify-between py-2 border-b border-slate-700/40"
              >
                <View>
                  <Text className="text-white">Venda #{sale.saleNumber}</Text>
                  <Text className="text-cosmo-muted text-xs">
                    {formatDateTime(sale.createdAt)}
                  </Text>
                </View>
                <Text className="text-white font-medium">
                  {formatCurrency(sale.total)}
                </Text>
              </View>
            ))
          )}
        </Card>

        <Card className="mb-6">
          <Text className="text-white font-semibold mb-2">Últimos alertas</Text>
          {alerts.length === 0 ? (
            <DashboardSectionEmpty message="Nenhum alerta operacional no momento." />
          ) : (
            alerts.map((alert) => (
              <View
                key={alert.id}
                className="py-2 border-b border-slate-700/40"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-white flex-1">{alert.title}</Text>
                  <Badge label={alert.severity} tone={alertTone(alert.severity)} />
                </View>
                <Text className="text-cosmo-muted mt-1">{alert.description}</Text>
                {alert.timestamp ? (
                  <Text className="text-cosmo-muted text-xs mt-1">
                    {formatDateTime(alert.timestamp)}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
