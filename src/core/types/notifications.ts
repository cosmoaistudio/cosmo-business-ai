export const NotificationChannels = {
  toast: "toast",
  email: "email",
  whatsapp: "whatsapp",
  push: "push",
  sms: "sms",
  webhook: "webhook",
  telegram: "telegram",
} as const;

export type NotificationChannel =
  (typeof NotificationChannels)[keyof typeof NotificationChannels];

export interface NotificationPayload {
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  recipient?: string;
  url?: string;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  queued?: boolean;
  error?: string;
}
