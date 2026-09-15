import { create } from "zustand";
import type { AppNotification, NotificationType } from "@/types/notifications";

interface NotificationStore {
  items: AppNotification[];
  unreadCount: number;
  add: (notification: Omit<AppNotification, "id" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

let counter = 0;

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: [],
  unreadCount: 0,
  add: (notification) => {
    const entry: AppNotification = {
      ...notification,
      id: `${Date.now()}-${counter++}`,
      read: false,
    };

    set((state) => ({
      items: [entry, ...state.items].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    }));
  },
  markRead: (id) =>
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, read: true } : item
      );
      return {
        items,
        unreadCount: items.filter((item) => !item.read).length,
      };
    }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    })),
  clear: () => set({ items: [], unreadCount: 0 }),
}));

export function buildNotificationFromType(
  type: NotificationType,
  metadata: Record<string, unknown> = {}
): Omit<AppNotification, "id" | "read"> {
  const map: Record<NotificationType, { title: string; message: string }> = {
    desktop_online: {
      title: "Desktop Online",
      message: String(metadata.deviceName ?? "Terminal conectado"),
    },
    desktop_offline: {
      title: "Desktop Offline",
      message: String(metadata.deviceName ?? "Terminal desconectado"),
    },
    new_order: {
      title: "Novo pedido",
      message: "Um novo pedido entrou na fila operacional.",
    },
    delayed_order: {
      title: "Pedido atrasado",
      message: "Há comandos/pedidos aguardando há muito tempo.",
    },
    product_paused: {
      title: "Produto pausado",
      message: String(metadata.productName ?? "Produto pausado remotamente"),
    },
    print_error: {
      title: "Erro de impressão",
      message: String(metadata.error ?? "Falha ao imprimir no desktop"),
    },
    command_completed: {
      title: "Comando concluído",
      message: String(metadata.command ?? "Comando executado com sucesso"),
    },
    command_failed: {
      title: "Comando falhou",
      message: String(metadata.error ?? "Falha ao executar comando remoto"),
    },
    system: {
      title: "Sistema",
      message: String(metadata.message ?? "Evento do sistema"),
    },
  };

  const content = map[type];
  return {
    type,
    title: content.title,
    message: content.message,
    createdAt: new Date().toISOString(),
    metadata,
  };
}
