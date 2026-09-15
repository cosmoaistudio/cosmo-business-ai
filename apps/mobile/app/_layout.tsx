import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MobileSplash } from "@/components/MobileSplash";
import {
  AppProviders,
  AuthProvider,
  PushNotificationProvider,
  RealtimeProvider,
} from "@/providers";
import { validateMobileBootstrap } from "@/lib/bootstrapValidation";

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    void validateMobileBootstrap().then((result) => {
      if (__DEV__) {
        console.info("[Cosmo Mobile] Bootstrap validation:", result);
      }
    });
  }, []);

  return (
    <AppProviders>
      <AuthProvider>
        <PushNotificationProvider>
          <RealtimeProvider>
            <StatusBar style="light" />
            {showSplash ? <MobileSplash onFinish={() => setShowSplash(false)} /> : null}
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#050816" } }} />
          </RealtimeProvider>
        </PushNotificationProvider>
      </AuthProvider>
    </AppProviders>
  );
}
