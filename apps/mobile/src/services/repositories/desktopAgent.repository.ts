import { supabase } from "@/lib/supabase";
import {
  DESKTOP_AGENT_STATUS,
  type DesktopAgentRecord,
} from "@cosmo/remote-commands";

export async function listDesktopAgents(organizationId: string) {
  const { data, error } = await supabase
    .from("desktop_agents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("last_seen_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DesktopAgentRecord[];
}

export async function getOnlineDesktopAgents(organizationId: string) {
  const { data, error } = await supabase
    .from("desktop_agents")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", DESKTOP_AGENT_STATUS.ONLINE)
    .order("last_seen_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DesktopAgentRecord[];
}

export function subscribeToDesktopAgents(
  organizationId: string,
  onChange: (agent: DesktopAgentRecord) => void
) {
  const channel = supabase
    .channel(`mobile-desktop-agents:${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "desktop_agents",
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        const record = (payload.new ?? payload.old) as DesktopAgentRecord;
        if (record?.id) onChange(record);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
