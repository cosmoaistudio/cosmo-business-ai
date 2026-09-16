import { describe, expect, it } from "vitest";
import {
  acceptsMode,
  describePrepTime,
  resolveStoreStatus,
} from "@/features/digital-ordering/menu/core/storeStatus";
import type {
  DigitalOrderMode,
  DigitalStoreSettings,
} from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";

function storeSettings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "loja-teste",
    organizationId: "org-1",
    organizationName: "Loja Teste",
    logoUrl: null,
    bannerUrl: null,
    welcomeMessage: "Bem-vindo",
    bannerMessage: null,
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "generic",
    menuTheme: {},
    acceptsPickup: true,
    acceptsDelivery: true,
    acceptsDineIn: true,
    minimumOrder: 0,
    deliveryFee: 0,
    averagePrepMinutes: 20,
    publishedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("acceptsMode", () => {
  it("maps each mode to its own store flag", () => {
    const store = storeSettings({
      acceptsPickup: true,
      acceptsDelivery: false,
      acceptsDineIn: false,
    });

    expect(acceptsMode(store, "pickup")).toBe(true);
    expect(acceptsMode(store, "delivery")).toBe(false);
    expect(acceptsMode(store, "dine_in")).toBe(false);
  });

  it("never gates event mode, which is QR driven", () => {
    const store = storeSettings({
      acceptsPickup: false,
      acceptsDelivery: false,
      acceptsDineIn: false,
    });

    expect(acceptsMode(store, "event")).toBe(true);
  });
});

describe("describePrepTime", () => {
  it("formats minutes below an hour", () => {
    expect(describePrepTime(20)).toBe("~20 min");
  });

  it("formats whole hours and hours with remainder", () => {
    expect(describePrepTime(60)).toBe("~1 h");
    expect(describePrepTime(90)).toBe("~1 h 30 min");
  });

  it("returns null for absent or invalid durations", () => {
    expect(describePrepTime(0)).toBeNull();
    expect(describePrepTime(-5)).toBeNull();
    expect(describePrepTime(Number.NaN)).toBeNull();
  });
});

describe("resolveStoreStatus", () => {
  it("reports an open store with the estimated prep time", () => {
    const status = resolveStoreStatus(
      storeSettings({ averagePrepMinutes: 25 }),
      "pickup"
    );

    expect(status.availability).toBe("open");
    expect(status.isAcceptingOrders).toBe(true);
    expect(status.tone).toBe("positive");
    expect(status.detail).toBe("~25 min");
  });

  it("flags a store that was never published", () => {
    const status = resolveStoreStatus(
      storeSettings({ publishedAt: null }),
      "pickup"
    );

    expect(status.availability).toBe("unpublished");
    expect(status.isAcceptingOrders).toBe(false);
    expect(status.tone).toBe("warning");
  });

  it("flags a mode the store does not accept", () => {
    const status = resolveStoreStatus(
      storeSettings({ acceptsDelivery: false }),
      "delivery"
    );

    expect(status.availability).toBe("mode_unavailable");
    expect(status.isAcceptingOrders).toBe(false);
    expect(status.label).toContain("Delivery");
  });

  it("prioritises the unpublished state over an unavailable mode", () => {
    const status = resolveStoreStatus(
      storeSettings({ publishedAt: null, acceptsDelivery: false }),
      "delivery"
    );

    expect(status.availability).toBe("unpublished");
  });

  it("degrades to unknown without a store", () => {
    const status = resolveStoreStatus(null, "pickup");

    expect(status.availability).toBe("unknown");
    expect(status.isAcceptingOrders).toBe(false);
    expect(status.detail).toBeNull();
  });

  it("stays consistent across every mode of a fully open store", () => {
    const store = storeSettings();
    const modes: DigitalOrderMode[] = ["dine_in", "pickup", "delivery", "event"];

    for (const mode of modes) {
      expect(resolveStoreStatus(store, mode).isAcceptingOrders).toBe(true);
    }
  });

  it("omits the prep time detail when the store has none configured", () => {
    const status = resolveStoreStatus(
      storeSettings({ averagePrepMinutes: 0 }),
      "pickup"
    );

    expect(status.availability).toBe("open");
    expect(status.detail).toBeNull();
  });
});
