import { supabase } from "@/lib/supabase";
import {
  REALTIME_BROADCAST_EVENT,
  REMOTE_COMMAND_STATUS,
  buildOrganizationChannel,
  type RemoteCommandRecord,
  type RemoteCommandType,
} from "@cosmo/remote-commands";

export interface CreateRemoteCommandInput {
  organizationId: string;
  command: RemoteCommandType;
  payload?: Record<string, unknown>;
  source?: string;
  expiresInMinutes?: number;
}

export async function createRemoteCommand(input: CreateRemoteCommandInput) {
  const expiresAt = input.expiresInMinutes
    ? new Date(Date.now() + input.expiresInMinutes * 60_000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("remote_commands")
    .insert({
      organization_id: input.organizationId,
      command: input.command,
      payload: input.payload ?? {},
      source: input.source ?? "mobile",
      status: REMOTE_COMMAND_STATUS.PENDING,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as RemoteCommandRecord;
}

export async function listRemoteCommands(organizationId: string, limit = 50) {
  const { data, error } = await supabase
    .from("remote_commands")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RemoteCommandRecord[];
}

export function subscribeToRemoteCommands(
  organizationId: string,
  onChange: (command: RemoteCommandRecord) => void
) {
  const channel = supabase
    .channel(`mobile-remote-commands:${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "remote_commands",
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        const record = (payload.new ?? payload.old) as RemoteCommandRecord;
        if (record?.id) onChange(record);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function broadcastRemoteCommand(
  organizationId: string,
  command: RemoteCommandRecord
) {
  const channelName = buildOrganizationChannel(organizationId);
  const channel = supabase.channel(channelName);
  await channel.subscribe();

  await channel.send({
    type: "broadcast",
    event: REALTIME_BROADCAST_EVENT,
    payload: command,
  });

  await supabase.removeChannel(channel);
}
