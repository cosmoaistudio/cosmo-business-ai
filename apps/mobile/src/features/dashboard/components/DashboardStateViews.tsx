import { ActivityIndicator, Text, View } from "react-native";
import { Card, Screen } from "@/components/ui";

export function DashboardLoadingState() {
  return (
    <Screen className="items-center justify-center">
      <ActivityIndicator color="#6366f1" size="large" />
      <Text className="text-cosmo-muted mt-4">Carregando dashboard...</Text>
    </Screen>
  );
}

export function DashboardErrorState({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: string;
}) {
  return (
    <Screen>
      <Text className="text-red-400 text-lg font-semibold mb-3">{title}</Text>
      <Card>
        <Text className="text-red-300">{message}</Text>
        {details ? <Text className="text-cosmo-muted mt-3">{details}</Text> : null}
      </Card>
    </Screen>
  );
}

export function DashboardEmptyState({ message }: { message: string }) {
  return (
    <Screen className="items-center justify-center">
      <Text className="text-cosmo-muted text-center px-6">{message}</Text>
    </Screen>
  );
}

export function DashboardSectionEmpty({ message }: { message: string }) {
  return (
    <View className="py-2">
      <Text className="text-cosmo-muted">{message}</Text>
    </View>
  );
}
