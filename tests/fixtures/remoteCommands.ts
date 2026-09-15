import type { RemoteCommandRecord } from "../../apps/desktop/electron/src/shared/remoteCommands.js";
import { REMOTE_COMMANDS, REMOTE_COMMAND_STATUS } from "../../apps/desktop/electron/src/shared/remoteCommands.js";

export function createRemoteCommandRecord(
  overrides: Partial<RemoteCommandRecord> = {}
): RemoteCommandRecord {
  return {
    id: "cmd-1",
    organization_id: "org-1",
    command: REMOTE_COMMANDS.PRINT_ORDER,
    payload: { lines: ["Venda #1"], saleNumber: 1 },
    status: REMOTE_COMMAND_STATUS.PENDING,
    source: "pdv",
    priority: 0,
    target: null,
    created_by: null,
    requested_by: null,
    agent_id: "agent-1",
    desktop_agent_id: "agent-1",
    result: null,
    error_message: null,
    execution_time_ms: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    processed_at: null,
    acknowledged_at: null,
    expires_at: null,
    ...overrides,
  };
}
