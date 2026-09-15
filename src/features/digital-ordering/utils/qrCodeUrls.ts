import type { DigitalQrCodeType } from "../types/digitalStore.types";

function getAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://app.cosmo.business";
}

export function buildDigitalOrderingUrl(input: {
  slug: string;
  type: DigitalQrCodeType;
  tableId?: string;
}) {
  const origin = getAppOrigin();
  const { slug, type, tableId } = input;

  switch (type) {
    case "table":
      return `${origin}/table/${tableId ?? "1"}?store=${encodeURIComponent(slug)}`;
    case "pickup":
      return `${origin}/pickup?store=${encodeURIComponent(slug)}`;
    case "delivery":
      return `${origin}/delivery?store=${encodeURIComponent(slug)}`;
    case "event":
      return `${origin}/menu/${encodeURIComponent(slug)}?mode=event`;
    default:
      return `${origin}/menu/${encodeURIComponent(slug)}`;
  }
}

export function buildQrCodeImageUrl(targetUrl: string, size = 240) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}
