import {
  AutomationsHubPage,
  AutomationsProvider,
} from "@/features/automation";
import { AnimatedPage } from "@/motion";

export default function AutomationsPage() {
  return (
    <AutomationsProvider>
      <AnimatedPage>
        <AutomationsHubPage />
      </AnimatedPage>
    </AutomationsProvider>
  );
}
