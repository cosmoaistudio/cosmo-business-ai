/**
 * Mobile React Query key factory.
 * Keep scopes stable to avoid accidental cache thrash.
 */

export const queryKeys = {
  mobile: ["mobile"] as const,
  dashboard: {
    all: ["mobile", "dashboard"] as const,
    snapshot: (organizationId: string) =>
      ["mobile", "dashboard", organizationId] as const,
  },
  commands: {
    all: ["mobile", "commands"] as const,
  },
  notifications: {
    all: ["mobile", "notifications"] as const,
  },
} as const;
