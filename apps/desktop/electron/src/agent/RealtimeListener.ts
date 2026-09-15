import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  REALTIME_BROADCAST_EVENT,
  buildOrganizationChannel,
  type RemoteCommandRecord,
} from "../shared/remoteCommands.js";
import { agentLogger } from "./logger.js";
import { desktopConfig } from "./config/DesktopConfig.js";
import { getDesktopSupabase } from "./repository/supabaseClient.js";
import type { CommandRecordHandler } from "./types.js";

export class RealtimeListener {
  private channel: RealtimeChannel | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private onCommand: CommandRecordHandler | null = null;
  private connected = false;

  isConnected() {
    return this.connected;
  }

  async start(onCommand: CommandRecordHandler) {
    this.onCommand = onCommand;
    await this.subscribe();
    this.startPolling();
    await this.claimPending();
  }

  shutdown() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    void this.channel?.unsubscribe();
    this.onCommand = null;
    this.connected = false;
  }

  async claimPending() {
    const agentId = desktopConfig.getAgentId();
    if (!agentId || !this.onCommand) return;

    const { remoteCommandRepository } = await import(
      "./repository/remoteCommand.repository.js"
    );

    const records = await remoteCommandRepository.claimPending(agentId);

    for (const record of records) {
      void this.onCommand(record);
    }
  }

  async publishEvent(type: string, payload: Record<string, unknown>) {
    const organizationId = desktopConfig.getOrganizationId();

    if (!organizationId || !this.channel) return;

    await this.channel.send({
      type: "broadcast",
      event: type,
      payload,
    });
  }

  private async subscribe() {
    const supabase = getDesktopSupabase();
    const organizationId = desktopConfig.getOrganizationId();

    await this.channel?.unsubscribe();

    const channelName = buildOrganizationChannel(organizationId);

    agentLogger.info("Conectando ao Supabase Realtime", { channelName });

    this.channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "remote_commands",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          void this.onCommand?.(payload.new as RemoteCommandRecord);
        }
      )
      .on("broadcast", { event: REALTIME_BROADCAST_EVENT }, (message) => {
        void this.onCommand?.(message.payload as RemoteCommandRecord);
      })
      .subscribe((status) => {
        this.connected = status === "SUBSCRIBED";
        agentLogger.info("Status Realtime", { status, channelName });
      });
  }

  private startPolling() {
    this.pollTimer = setInterval(() => {
      void this.claimPending();
    }, 10000);
  }
}

export const realtimeListener = new RealtimeListener();
