import { DiagnosticsPage, SaasProvider } from "@/features/saas";
import { AnimatedPage } from "@/motion";

export default function Diagnostics() {
  return (
    <SaasProvider>
      <AnimatedPage>
        <DiagnosticsPage />
      </AnimatedPage>
    </SaasProvider>
  );
}
