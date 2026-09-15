import type {
  CashSessionRow,
  DesktopAgentRow,
} from "../repository/operationCenter.repository";
import type { ConnectivityStatus } from "../types/operationCenter";

const ONLINE_THRESHOLD_MS = 5 * 60_000;

function isRecentlyOnline(lastSeenAt: string) {
  return Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_THRESHOLD_MS;
}

function agentRole(agent: DesktopAgentRow) {
  const meta = agent.metadata ?? {};
  const role = typeof meta.role === "string" ? meta.role.toLowerCase() : "";
  const name = agent.device_name.toLowerCase();

  if (role.includes("mobile") || name.includes("mobile")) return "mobile";
  if (role.includes("delivery") || name.includes("entrega")) return "delivery";
  return "desktop";
}

export function buildConnectivityStatus(input: {
  agents: DesktopAgentRow[];
  cashSessions: CashSessionRow[];
  realtimeConnected: boolean;
}): ConnectivityStatus {
  const desktops = input.agents.filter((a) => agentRole(a) === "desktop");
  const mobiles = input.agents.filter((a) => agentRole(a) === "mobile");
  const deliveryAgents = input.agents.filter((a) => agentRole(a) === "delivery");

  const countOnline = (agents: DesktopAgentRow[]) =>
    agents.filter(
      (agent) =>
        agent.status === "online" ||
        (agent.status !== "maintenance" && isRecentlyOnline(agent.last_seen_at))
    ).length;

  const desktopOnline = countOnline(desktops);
  const mobileOnline = countOnline(mobiles);
  const deliveryOnline = countOnline(deliveryAgents);

  return {
    desktopOnline,
    desktopTotal: Math.max(desktops.length, 1),
    mobileOnline,
    mobileTotal: Math.max(mobiles.length, mobileOnline > 0 ? mobileOnline : 1),
    cashiersOnline: input.cashSessions.length,
    cashiersTotal: Math.max(input.cashSessions.length, 1),
    deliveryOnline,
    deliveryTotal: Math.max(deliveryAgents.length, deliveryOnline > 0 ? deliveryOnline : 1),
    realtimeConnected: input.realtimeConnected,
  };
}

export function buildDesktopTimelineEvents(agents: DesktopAgentRow[]) {
  return agents.slice(0, 5).map((agent) => ({
    id: `desktop-${agent.id}`,
    timestamp: agent.last_seen_at,
    label:
      agent.status === "online" || isRecentlyOnline(agent.last_seen_at)
        ? "Desktop conectado"
        : "Desktop desconectado",
    description: agent.device_name,
    type:
      agent.status === "online" || isRecentlyOnline(agent.last_seen_at)
        ? ("desktop_connected" as const)
        : ("desktop_disconnected" as const),
  }));
}
