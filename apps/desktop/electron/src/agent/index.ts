export { DesktopAgent, desktopAgent } from "./DesktopAgent.js";
export { RealtimeListener, realtimeListener } from "./RealtimeListener.js";
export { CommandDispatcher, commandDispatcher } from "./CommandDispatcher.js";
export { CommandRegistry, commandRegistry } from "./CommandRegistry.js";
export { BaseCommand } from "./BaseCommand.js";
export { agentLogger } from "./logger.js";
export { registerAllCommands } from "./commands/registerCommands.js";
export { desktopAgentRepository } from "./repository/desktopAgent.repository.js";
export { remoteCommandRepository } from "./repository/remoteCommand.repository.js";
export { getDesktopSupabase } from "./repository/supabaseClient.js";
export {
  DesktopSecretManager,
  DesktopSecretValidationError,
  DESKTOP_ENV_FILENAME,
  DESKTOP_ENV_VARIABLES,
  buildDesktopAgentNoticeDetail,
} from "./config/DesktopSecretManager.js";
export { desktopConfig } from "./config/DesktopConfig.js";
export { healthCheck } from "./health/HealthCheck.js";
export {
  DESKTOP_LIFECYCLE_STATUS,
  desktopStatusManager,
} from "./status/DesktopLifecycleStatus.js";
export type * from "./types.js";
