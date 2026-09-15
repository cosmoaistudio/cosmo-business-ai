import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/store/authStore";

export default function AppLayout() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-cosmo-surface">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#334155" },
        tabBarActiveTintColor: "#818cf8",
        tabBarInactiveTintColor: "#94a3b8",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="commands" options={{ title: "Comandos" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alertas" }} />
    </Tabs>
  );
}
