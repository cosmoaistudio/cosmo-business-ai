/** Shared boot clock for [Cosmo Boot|Window|Load|Splash|Startup] logs */

let bootOrigin = 0;

export function markBootOrigin(now = Date.now()) {
  bootOrigin = now;
  return bootOrigin;
}

export function bootMs(now = Date.now()) {
  if (!bootOrigin) bootOrigin = now;
  return now - bootOrigin;
}

export function bootTrace(scope: string, message: string, extra?: string) {
  const ms = bootMs();
  if (extra) {
    console.info(`[Cosmo ${scope}] ${message} +${ms}ms — ${extra}`);
  } else {
    console.info(`[Cosmo ${scope}] ${message} +${ms}ms`);
  }
}

/** Unified startup timeline — one label per milestone */
export function startupTrace(step: string, extra?: string) {
  const ms = bootMs();
  if (extra) {
    console.info(`[Cosmo Startup] ${step} +${ms}ms — ${extra}`);
  } else {
    console.info(`[Cosmo Startup] ${step} +${ms}ms`);
  }
}
