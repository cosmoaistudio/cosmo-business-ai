import PageHeader from "@/components/shared/PageHeader";
import {
  OperationCenter,
  useOperationCenter,
} from "@/features/operation-center";
import { AnimatedPage, AnimatedSection } from "@/motion";

export default function OperationCenterPage() {
  const {
    data,
    loading,
    period,
    screen,
    viewMode,
    setPeriod,
    setScreen,
    setViewMode,
  } = useOperationCenter("today");

  const isTvMode = viewMode === "tv";

  return (
    <AnimatedPage className={isTvMode ? "" : "space-y-8"}>
      {!isTvMode && (
        <PageHeader
          title="Centro de Operações"
          subtitle="Painel operacional em tempo real — mapa, alertas, timeline e health score."
        />
      )}

      <AnimatedSection delay={0.06}>
        <OperationCenter
          data={data}
          loading={loading}
          period={period}
          screen={screen}
          viewMode={viewMode}
          onPeriodChange={setPeriod}
          onScreenChange={setScreen}
          onViewModeChange={setViewMode}
        />
      </AnimatedSection>
    </AnimatedPage>
  );
}
