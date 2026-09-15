import type {
  PushNotificationPayload,
  PushProviderAdapter,
  PushTokenRegistration,
} from "@/types/notifications";

/**
 * Camada de arquitetura para Push Notifications.
 * Firebase/FCM/APNs serão plugados aqui futuramente via adapter.
 */
export class PushNotificationService {
  private adapter: PushProviderAdapter | null = null;
  private registeredToken: string | null = null;

  setAdapter(adapter: PushProviderAdapter) {
    this.adapter = adapter;
  }

  async register(registration: PushTokenRegistration) {
    if (!this.adapter) {
      console.info("[PushNotificationService] Adapter não configurado (Firebase pendente).");
      return null;
    }

    const token = await this.adapter.registerForPushNotifications();
    this.registeredToken = token;

    // Persistência futura: salvar token vinculado a organizationId/userId no Supabase.
    console.info("[PushNotificationService] Token registrado", {
      platform: registration.platform,
      organizationId: registration.organizationId,
      userId: registration.userId,
      token: token ? `${token.slice(0, 8)}...` : null,
    });

    return token;
  }

  async unregister() {
    if (!this.adapter || !this.registeredToken) return;
    await this.adapter.unregisterPushNotifications(this.registeredToken);
    this.registeredToken = null;
  }

  async notifyLocal(payload: PushNotificationPayload) {
    if (!this.adapter) {
      console.info("[PushNotificationService] Local notification (stub):", payload.title);
      return;
    }

    await this.adapter.scheduleLocalNotification(payload);
  }
}

export const pushNotificationService = new PushNotificationService();

export class NoopPushProviderAdapter implements PushProviderAdapter {
  async registerForPushNotifications() {
    return null;
  }

  async unregisterPushNotifications() {
    return;
  }

  async scheduleLocalNotification(payload: PushNotificationPayload) {
    console.info("[NoopPushProvider]", payload.title, payload.body);
  }
}
