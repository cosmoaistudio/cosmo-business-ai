import type { HealthScoreBreakdown } from "../types/operationCenter";
import HealthScorePanel from "./HealthScorePanel";

interface HealthCardProps {
  health: HealthScoreBreakdown;
}

export default function HealthCard({ health }: HealthCardProps) {
  return <HealthScorePanel health={health} />;
}
