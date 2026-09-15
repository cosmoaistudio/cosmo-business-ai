const PREFIX = "[Cosmo Updater]";

export function sanitizeUpdaterLogMeta(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  const blocked = /token|secret|password|authorization|cookie|credential/i;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (blocked.test(key)) continue;
    next[key] = value;
  }
  return next;
}

export const updaterLog = {
  info(message: string, meta?: Record<string, unknown>) {
    const safe = sanitizeUpdaterLogMeta(meta);
    if (safe && Object.keys(safe).length) {
      console.info(`${PREFIX} ${message}`, safe);
      return;
    }
    console.info(`${PREFIX} ${message}`);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    const safe = sanitizeUpdaterLogMeta(meta);
    if (safe && Object.keys(safe).length) {
      console.warn(`${PREFIX} ${message}`, safe);
      return;
    }
    console.warn(`${PREFIX} ${message}`);
  },
  error(message: string, meta?: Record<string, unknown>) {
    const safe = sanitizeUpdaterLogMeta(meta);
    if (safe && Object.keys(safe).length) {
      console.error(`${PREFIX} ${message}`, safe);
      return;
    }
    console.error(`${PREFIX} ${message}`);
  },
};
