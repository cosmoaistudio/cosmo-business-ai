type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString();
  return meta
    ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    if (import.meta.env.DEV) {
      console.debug(formatMessage("debug", message, meta));
    }
  },

  info(message: string, meta?: LogMeta) {
    console.info(formatMessage("info", message, meta));
  },

  warn(message: string, meta?: LogMeta) {
    console.warn(formatMessage("warn", message, meta));
  },

  error(message: string, error?: unknown, meta?: LogMeta) {
    const payload =
      error instanceof Error
        ? { ...meta, error: error.message, stack: error.stack }
        : { ...meta, error };

    console.error(formatMessage("error", message, payload));
  },
};
