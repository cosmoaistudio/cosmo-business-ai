import { useEffect } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { auditEngine } from "./audit/AuditEngine";
import { automationEngine } from "./automation/AutomationEngine";
import { eventBus } from "./event-bus/EventBus";
import { featureFlagEngine } from "./feature-flags/FeatureFlagEngine";

function shutdownCore() {
  automationEngine.shutdown();
  auditEngine.shutdown();
  featureFlagEngine.clear();
  auditEngine.clearContext();
}

export function CoreProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) {
      shutdownCore();
      return;
    }

    auditEngine.setContext({
      userId: profile.user_id,
      userEmail: null,
      organizationId: profile.organization_id,
    });

    void featureFlagEngine.load(profile.organization_id);

    auditEngine.enableAutoAudit((handler) => eventBus.subscribeAll(handler));

    const cleanupAutomation = automationEngine.initialize();

    return () => {
      cleanupAutomation?.();
      shutdownCore();
    };
  }, [user, profile]);

  return children;
}
