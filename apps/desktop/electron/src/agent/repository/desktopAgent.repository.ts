import { app } from "electron";
import {
  DESKTOP_AGENT_STATUS,
  type DesktopAgentRecord,
} from "../../shared/remoteCommands.js";
import { desktopConfig } from "../config/DesktopConfig.js";
import { getDesktopSupabase } from "./supabaseClient.js";
import { agentLogger } from "../logger.js";

export class DesktopAgentRepository {
  async register(): Promise<DesktopAgentRecord | null> {
    const supabase = getDesktopSupabase();
    const organizationId = desktopConfig.getOrganizationId();
    const machineId = desktopConfig.getMachineId();

    if (!organizationId || !machineId) {
      agentLogger.warn("Registro ignorado — config incompleta.");
      return null;
    }

    const { data, error } = await supabase
      .from("desktop_agents")
      .upsert(
        {
          id: desktopConfig.getAgentId() ?? undefined,
          organization_id: organizationId,
          device_name: desktopConfig.getDesktopName(),
          machine_id: machineId,
          status: DESKTOP_AGENT_STATUS.ONLINE,
          last_seen_at: new Date().toISOString(),
          metadata: {
            platform: process.platform,
            version: app.getVersion(),
            environment: desktopConfig.getEnvironment(),
          },
        },
        { onConflict: "organization_id,machine_id" }
      )
      .select("*")
      .single();

    if (error) {
      agentLogger.error("Falha ao registrar agente", { error: error.message });
      return null;
    }

    desktopConfig.setAgentId((data as DesktopAgentRecord).id);
    await desktopConfig.persist();

    agentLogger.info("Agente registrado", {
      agentId: desktopConfig.getAgentId(),
      organizationId,
      desktopName: desktopConfig.getDesktopName(),
    });

    return data as DesktopAgentRecord;
  }

  async touch() {
    const supabase = getDesktopSupabase();
    const agentId = desktopConfig.getAgentId();
    if (!agentId) return;

    await supabase
      .from("desktop_agents")
      .update({
        status: DESKTOP_AGENT_STATUS.ONLINE,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", agentId);
  }

  async setStatus(status: string) {
    const supabase = getDesktopSupabase();
    const agentId = desktopConfig.getAgentId();
    if (!agentId) return;

    await supabase
      .from("desktop_agents")
      .update({ status, last_seen_at: new Date().toISOString() })
      .eq("id", agentId);
  }
}

export const desktopAgentRepository = new DesktopAgentRepository();
