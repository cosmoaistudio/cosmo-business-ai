/**
 * Shared calendar helpers for web features.
 * Keep these pure and timezone-local (browser / Electron renderer).
 */

export function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function startOfTodayIso() {
  return startOfDay().toISOString();
}

export function isSameLocalDay(dateString: string, reference = new Date()) {
  const date = new Date(dateString);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function isToday(dateString: string) {
  return isSameLocalDay(dateString, new Date());
}
