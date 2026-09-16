import { describe, expect, it } from "vitest";
import {
  buildDigitalOrderingUrl,
  buildPublicMenuUrl,
  buildQrCodeImageUrl,
} from "@/features/digital-ordering/utils/qrCodeUrls";

const origin = window.location.origin;

describe("buildPublicMenuUrl", () => {
  it("points to the registered /menu/:slug route", () => {
    expect(buildPublicMenuUrl("acai-do-ze")).toBe(`${origin}/menu/acai-do-ze`);
  });

  it("encodes slugs so the URL stays valid", () => {
    expect(buildPublicMenuUrl("loja do josé")).toBe(
      `${origin}/menu/loja%20do%20jos%C3%A9`
    );
  });
});

describe("buildDigitalOrderingUrl", () => {
  it("resolves the menu type to the public menu URL", () => {
    expect(buildDigitalOrderingUrl({ slug: "minha-loja", type: "menu" })).toBe(
      buildPublicMenuUrl("minha-loja")
    );
  });

  it("keeps the existing URLs for the other QR types", () => {
    const slug = "minha-loja";

    expect(buildDigitalOrderingUrl({ slug, type: "pickup" })).toBe(
      `${origin}/pickup?store=minha-loja`
    );
    expect(buildDigitalOrderingUrl({ slug, type: "delivery" })).toBe(
      `${origin}/delivery?store=minha-loja`
    );
    expect(buildDigitalOrderingUrl({ slug, type: "event" })).toBe(
      `${origin}/menu/minha-loja?mode=event`
    );
    expect(buildDigitalOrderingUrl({ slug, type: "table", tableId: "7" })).toBe(
      `${origin}/table/7?store=minha-loja`
    );
  });

  it("falls back to table 1 when no table is given", () => {
    expect(buildDigitalOrderingUrl({ slug: "loja", type: "table" })).toContain(
      "/table/1"
    );
  });
});

describe("buildQrCodeImageUrl", () => {
  it("encodes the target URL and honours the requested size", () => {
    const target = buildPublicMenuUrl("minha-loja");
    const image = buildQrCodeImageUrl(target, 1024);

    expect(image).toContain("size=1024x1024");
    expect(image).toContain(encodeURIComponent(target));
  });
});
