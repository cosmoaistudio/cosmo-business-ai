import { toast } from "sonner";
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from "../types/notifications";

type ChannelHandler = (
  payload: NotificationPayload
) => NotificationResult | Promise<NotificationResult>;

class NotificationEngineImpl {
  private handlers = new Map<NotificationChannel, ChannelHandler>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register("toast", (payload) => {
      toast.info(payload.message, {
        description: payload.title,
      });

      return { channel: "toast", success: true };
    });

    const queuedChannels: NotificationChannel[] = [
      "email",
      "whatsapp",
      "push",
      "sms",
      "webhook",
      "telegram",
    ];

    for (const channel of queuedChannels) {
      this.register(channel, (_payload) => ({
        channel,
        success: true,
        queued: true,
        error: undefined,
      }));
    }
  }

  register(channel: NotificationChannel, handler: ChannelHandler) {
    this.handlers.set(channel, handler);
  }

  async send(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    const handler = this.handlers.get(channel);

    if (!handler) {
      return {
        channel,
        success: false,
        error: `Canal não registrado: ${channel}`,
      };
    }

    try {
      return await handler(payload);
    } catch (error) {
      return {
        channel,
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  async sendMany(
    channels: NotificationChannel[],
    payload: NotificationPayload
  ): Promise<NotificationResult[]> {
    return Promise.all(channels.map((channel) => this.send(channel, payload)));
  }
}

export const notificationEngine = new NotificationEngineImpl();
