import type { ConnectivityStatus } from "../types/operationCenter";

export function toMobileConnectivitySnapshot(connectivity: ConnectivityStatus) {
  return {
    mobileOnline: connectivity.mobileOnline,
    deliveryOnline: connectivity.deliveryOnline,
    realtimeConnected: connectivity.realtimeConnected,
  };
}
