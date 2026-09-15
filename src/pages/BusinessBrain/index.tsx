import {
  BusinessBrainPage,
  BusinessBrainProvider,
} from "@/features/business-brain";
import { AnimatedPage } from "@/motion";

export default function BusinessBrain() {
  return (
    <BusinessBrainProvider>
      <AnimatedPage>
        <BusinessBrainPage />
      </AnimatedPage>
    </BusinessBrainProvider>
  );
}
