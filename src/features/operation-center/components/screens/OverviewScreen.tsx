import type { OperationCenterData } from "../../types/operationCenter";
import OperationalMap from "../OperationalMap";
import RealtimeMetricsBar from "../RealtimeMetricsBar";
import ConnectivityPanel from "../ConnectivityPanel";
import AlertCenter from "../AlertCenter";
import LiveTimeline from "../LiveTimeline";
import HealthScorePanel from "../HealthScorePanel";
import RecommendationCard from "../RecommendationCard";

interface OverviewScreenProps {
  data: OperationCenterData;
  tvMode?: boolean;
}

export default function OverviewScreen({ data, tvMode = false }: OverviewScreenProps) {
  return (
    <div className="space-y-6">
      <RealtimeMetricsBar metrics={data.realtime} compact={tvMode} />
      <OperationalMap sectors={data.sectors} tvMode={tvMode} />

      <div className={`grid gap-6 ${tvMode ? "xl:grid-cols-2" : "xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
        <div className="space-y-6">
          <AlertCenter alerts={data.alerts} tvMode={tvMode} />
          <LiveTimeline events={data.liveTimeline} live tvMode={tvMode} />
        </div>
        <div className="space-y-6">
          <HealthScorePanel health={data.health} tvMode={tvMode} />
          {!tvMode && <RecommendationCard recommendations={data.recommendations} />}
          <ConnectivityPanel connectivity={data.connectivity} compact={tvMode} />
        </div>
      </div>
    </div>
  );
}
