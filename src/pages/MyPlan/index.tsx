import { MyPlanPage, SaasProvider } from "@/features/saas";
import { AnimatedPage } from "@/motion";

export default function MyPlan() {
  return (
    <SaasProvider>
      <AnimatedPage>
        <MyPlanPage />
      </AnimatedPage>
    </SaasProvider>
  );
}
