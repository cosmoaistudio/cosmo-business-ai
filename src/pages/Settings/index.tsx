import { SaasProvider, SettingsHubPage } from "@/features/saas";
import { AnimatedPage } from "@/motion";

export default function Settings() {
  return (
    <SaasProvider>
      <AnimatedPage>
        <SettingsHubPage />
      </AnimatedPage>
    </SaasProvider>
  );
}
