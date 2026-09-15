import FullscreenOpsChrome from "@/components/shared/FullscreenOpsChrome";
import { KitchenDisplayBoard } from "@/features/kitchen-display";

export default function KitchenDisplayPage() {
  return (
    <FullscreenOpsChrome
      title="Cozinha"
      subtitle="Kitchen Display — produção em tempo real"
    >
      <KitchenDisplayBoard />
    </FullscreenOpsChrome>
  );
}
