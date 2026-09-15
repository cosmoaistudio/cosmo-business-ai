import type { DesktopAgentRecord } from "@cosmo/remote-commands";
import {
  getOnlineDesktopAgents,
  listDesktopAgents,
  subscribeToDesktopAgents,
} from "./repositories/desktopAgent.repository";

export class DesktopStatusService {
  listAgents(organizationId: string) {
    return listDesktopAgents(organizationId);
  }

  listOnlineAgents(organizationId: string) {
    return getOnlineDesktopAgents(organizationId);
  }

  async getSummary(organizationId: string) {
    const agents = await this.listAgents(organizationId);
    const online = agents.filter((agent) => agent.status === "online");

    return {
      total: agents.length,
      online: online.length,
      offline: agents.length - online.length,
      isAnyOnline: online.length > 0,
      agents,
    };
  }

  subscribe(organizationId: string, onChange: (agent: DesktopAgentRecord) => void) {
    return subscribeToDesktopAgents(organizationId, onChange);
  }
}

export const desktopStatusService = new DesktopStatusService();
