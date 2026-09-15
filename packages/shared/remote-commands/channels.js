export const REMOTE_COMMANDS = {
    PRINT_ORDER: "PRINT_ORDER",
    REPRINT_ORDER: "REPRINT_ORDER",
    OPEN_DRAWER: "OPEN_DRAWER",
    CLOSE_CASH_REGISTER: "CLOSE_CASH_REGISTER",
    OPEN_CASH_REGISTER: "OPEN_CASH_REGISTER",
    PAUSE_PRODUCT: "PAUSE_PRODUCT",
    ACTIVATE_PRODUCT: "ACTIVATE_PRODUCT",
    PAUSE_OPTION: "PAUSE_OPTION",
    ACTIVATE_OPTION: "ACTIVATE_OPTION",
    UPDATE_STOCK: "UPDATE_STOCK",
    RUN_BACKUP: "RUN_BACKUP",
    RESTART_PRINTER: "RESTART_PRINTER",
};
export const REMOTE_COMMAND_STATUS = {
    PENDING: "pending",
    PROCESSING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
};
export const DESKTOP_AGENT_STATUS = {
    ONLINE: "online",
    OFFLINE: "offline",
};
export const REMOTE_COMMAND_SOURCE = {
    MOBILE: "mobile",
    WEB: "web",
    AUTOMATION: "automation",
    SYSTEM: "system",
};
export function isRemoteCommandType(value) {
    return Object.values(REMOTE_COMMANDS).includes(value);
}
export function buildOrganizationChannel(organizationId) {
    return `cosmo:org:${organizationId}:remote`;
}
export function buildDesktopAgentChannel(organizationId, agentId) {
    return `cosmo:org:${organizationId}:agent:${agentId}`;
}
export const REALTIME_BROADCAST_EVENT = "remote-command";
//# sourceMappingURL=channels.js.map