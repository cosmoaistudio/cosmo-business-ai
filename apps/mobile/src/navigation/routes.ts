export const APP_ROUTES = {
  login: "/(auth)/login",
  dashboard: "/(app)",
  commands: "/(app)/commands",
  notifications: "/(app)/notifications",
  productComposer: "/(app)/product-composer",
} as const;

export const TAB_ITEMS = [
  { key: "dashboard", title: "Dashboard", href: "/(app)" as const },
  { key: "commands", title: "Comandos", href: "/(app)/commands" as const },
  { key: "notifications", title: "Alertas", href: "/(app)/notifications" as const },
];
