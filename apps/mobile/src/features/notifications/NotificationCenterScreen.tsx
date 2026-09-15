import { Pressable, ScrollView, Text, View } from "react-native";
import { Badge, Card, Screen, SectionTitle } from "@/components/ui";
import { useNotificationActions } from "@/hooks";

function toneForType(type: string) {
  if (type.includes("offline") || type.includes("failed") || type.includes("error")) {
    return "danger" as const;
  }
  if (type.includes("delayed")) return "warning" as const;
  if (type.includes("online") || type.includes("completed")) return "success" as const;
  return "default" as const;
}

export function NotificationCenterScreen() {
  const { items, unreadCount, markRead, markAllRead } = useNotificationActions();

  return (
    <Screen>
      <SectionTitle
        title="Notification Center"
        subtitle={`${unreadCount} não lida(s)`}
      />

      {items.length > 0 ? (
        <Pressable onPress={markAllRead}>
          <Text className="text-cosmo-primary mb-3">Marcar todas como lidas</Text>
        </Pressable>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Card>
            <Text className="text-cosmo-muted">
              Nenhum evento ainda. Alertas de Desktop, pedidos e comandos aparecerão aqui.
            </Text>
          </Card>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} onPress={() => markRead(item.id)}>
              <Card className={`mb-3 ${item.read ? "opacity-70" : ""}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold">{item.title}</Text>
                  <Badge label={item.type} tone={toneForType(item.type)} />
                </View>
                <Text className="text-cosmo-muted">{item.message}</Text>
                <Text className="text-slate-500 text-xs mt-2">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
