import {
  REMOTE_COMMAND_STATUS,
  type RemoteCommandRecord,
  type RemoteCommandResult,
} from "../../shared/remoteCommands.js";
import { getDesktopSupabase } from "./supabaseClient.js";
import { agentLogger } from "../logger.js";

export class RemoteCommandRepository {
  async claimPending(agentId: string, limit = 10): Promise<RemoteCommandRecord[]> {
    const supabase = getDesktopSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("claim_pending_commands_for_agent", {
      p_agent_id: agentId,
      p_limit: limit,
    });

    if (!error && data) {
      return data as RemoteCommandRecord[];
    }

    if (error) {
      agentLogger.warn("RPC claim falhou, usando fallback", { error: error.message });
    }

    return this.fetchPendingFallback(agentId, limit);
  }

  async acknowledge(commandId: string, agentId: string): Promise<boolean> {
    const supabase = getDesktopSupabase();
    if (!supabase) return false;

    const { error } = await supabase.rpc("acknowledge_remote_command", {
      p_command_id: commandId,
      p_agent_id: agentId,
    });

    if (!error) return true;

    agentLogger.warn("RPC acknowledge falhou, usando fallback", {
      commandId,
      error: error.message,
    });

    return this.markProcessingFallback(commandId, agentId);
  }

  async finalize(
    commandId: string,
    status: string,
    result: RemoteCommandResult,
    executionTimeMs?: number
  ): Promise<boolean> {
    const supabase = getDesktopSupabase();
    if (!supabase) return false;

    const { error } = await supabase.rpc("finalize_remote_command", {
      p_command_id: commandId,
      p_status: status,
      p_result: result.data ?? { ok: result.ok },
      p_error_message: result.error ?? null,
    });

    if (!error) return true;

    agentLogger.warn("RPC finalize falhou, usando fallback", {
      commandId,
      error: error.message,
    });

    return this.finalizeFallback(commandId, status, result, executionTimeMs);
  }

  async cancelExpired(commandId: string) {
    return this.finalize(commandId, REMOTE_COMMAND_STATUS.CANCELLED, {
      ok: false,
      error: "Comando expirado",
    });
  }

  private async fetchPendingFallback(
    agentId: string,
    limit: number
  ): Promise<RemoteCommandRecord[]> {
    const supabase = getDesktopSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("remote_commands")
      .select("*")
      .eq("status", REMOTE_COMMAND_STATUS.PENDING)
      .or(`agent_id.is.null,agent_id.eq.${agentId}`)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      agentLogger.error("Falha ao buscar pendentes", { error: error.message });
      return [];
    }

    return (data ?? []) as RemoteCommandRecord[];
  }

  private async markProcessingFallback(commandId: string, agentId: string) {
    const supabase = getDesktopSupabase();
    if (!supabase) return false;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("remote_commands")
      .update({
        status: REMOTE_COMMAND_STATUS.PROCESSING,
        agent_id: agentId,
        desktop_agent_id: agentId,
        acknowledged_at: now,
        started_at: now,
      })
      .eq("id", commandId)
      .eq("status", REMOTE_COMMAND_STATUS.PENDING);

    if (error) {
      agentLogger.error("Fallback acknowledge falhou", {
        commandId,
        error: error.message,
      });
      return false;
    }

    return true;
  }

  private async finalizeFallback(
    commandId: string,
    status: string,
    result: RemoteCommandResult,
    executionTimeMs?: number
  ) {
    const supabase = getDesktopSupabase();
    if (!supabase) return false;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("remote_commands")
      .update({
        status,
        result: result.data ?? { ok: result.ok },
        error_message: result.error ?? null,
        completed_at: now,
        processed_at: now,
        execution_time_ms: executionTimeMs ?? null,
      })
      .eq("id", commandId);

    if (error) {
      agentLogger.error("Fallback finalize falhou", {
        commandId,
        error: error.message,
      });
      return false;
    }

    return true;
  }
}

export const remoteCommandRepository = new RemoteCommandRepository();
