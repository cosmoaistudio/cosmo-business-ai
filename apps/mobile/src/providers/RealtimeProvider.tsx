import { useEffect } from "react";
import type { RemoteCommandRecord } from "@cosmo/remote-commands";
import type { DesktopAgentRecord } from "@cosmo/remote-commands";
import { commandService } from "@/services/CommandService";
import { desktopStatusService } from "@/services/DesktopStatusService";
import {
  NoopPushProviderAdapter,
  pushNotificationService,
} from "@/services/PushNotificationService";
import { useAuthStore } from "@/store/authStore";
import {
  buildNotificationFromType,
  useNotificationStore,
} from "@/store/notificationStore";

const DELAYED_MS = 15 * 60 * 1000;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const organizationId = useAuthStore((state) => state.organizationId);
  const userId = useAuthStore((state) => state.userId);
  const addNotification = useNotificationStore((state) => state.add);

  useEffect(() => {
    pushNotificationService.setAdapter(new NoopPushProviderAdapter());
  }, []);

  useEffect(() => {
    if (!organizationId || !userId) return;

    void pushNotificationService.register({
      token: "",
      platform: "android",
      organizationId,
      userId,
    });

    const unsubscribeAgents = desktopStatusService.subscribe(
      organizationId,
      (agent: DesktopAgentRecord) => {
        const type = agent.status === "online" ? "desktop_online" : "desktop_offline";
        addNotification(
          buildNotificationFromType(type, {
            deviceName: agent.device_name,
            agentId: agent.id,
          })
        );
      }
    );

    const unsubscribeCommands = commandService.subscribe(
      organizationId,
      (command: RemoteCommandRecord) => {
        if (command.status === "completed") {
          addNotification(
            buildNotificationFromType("command_completed", {
              command: command.command,
              commandId: command.id,
            })
          );
          return;
        }

        if (command.status === "failed") {
          const isPrint =
            command.command === "PRINT_ORDER" || command.command === "REPRINT_ORDER";

          addNotification(
            buildNotificationFromType(isPrint ? "print_error" : "command_failed", {
              command: command.command,
              error: command.error_message,
              commandId: command.id,
            })
          );
          return;
        }

        if (command.status === "pending") {
          addNotification(
            buildNotificationFromType("new_order", {
              command: command.command,
              commandId: command.id,
            })
          );

          const age = Date.now() - new Date(command.created_at).getTime();
          if (age >= DELAYED_MS) {
            addNotification(
              buildNotificationFromType("delayed_order", {
                command: command.command,
                commandId: command.id,
              })
            );
          }
        }

        if (
          command.command === "PAUSE_PRODUCT" &&
          (command.status === "completed" || command.status === "processing")
        ) {
          addNotification(
            buildNotificationFromType("product_paused", {
              productId: command.payload?.productId,
            })
          );
        }
      }
    );

    return () => {
      unsubscribeAgents();
      unsubscribeCommands();
    };
  }, [addNotification, organizationId, userId]);

  return <>{children}</>;
}
