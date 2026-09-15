export type NotificationType =
  | "desktop_online"
  | "desktop_offline"
  | "new_order"
  | "delayed_order"
  | "product_paused"
  | "print_error"
  | "command_completed"
  | "command_failed"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export interface PushTokenRegistration {
  token: string;
  platform: "ios" | "android" | "web";
  organizationId: string;
  userId: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushProviderAdapter {
  registerForPushNotifications(): Promise<string | null>;
  unregisterPushNotifications(token: string): Promise<void>;
  scheduleLocalNotification(payload: PushNotificationPayload): Promise<void>;
}
