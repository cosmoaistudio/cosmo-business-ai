import { HelpCenterPage, SaasProvider } from "@/features/saas";
import { AnimatedPage } from "@/motion";

export default function Help() {
  return (
    <SaasProvider>
      <AnimatedPage>
        <HelpCenterPage />
      </AnimatedPage>
    </SaasProvider>
  );
}
