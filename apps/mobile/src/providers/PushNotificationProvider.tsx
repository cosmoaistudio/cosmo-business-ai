import { PushNotificationService, pushNotificationService } from "@/services/PushNotificationService";

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  // Provider reservado para registrar adapter Firebase/FCM futuramente.
  void PushNotificationService;
  void pushNotificationService;
  return <>{children}</>;
}
