/**
 * Initials for establishment branding.
 * "Cosmo" → C | "Cosmo Burger" → CB | "Açaí do Cosmo" → AC
 */
export function getOrganizationInitials(name: string | null | undefined): string {
  const words = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) {
    return (words[0]?.charAt(0) || "?").toUpperCase();
  }

  const first = words[0]?.charAt(0) ?? "";
  const last = words[words.length - 1]?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}
