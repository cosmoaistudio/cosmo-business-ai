import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import type { MenuSeo, NicheConfig } from "../types/digitalMenu.types";

const MAX_DESCRIPTION_LENGTH = 160;

function truncate(value: string, max = MAX_DESCRIPTION_LENGTH): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildMenuSeo(
  store: DigitalStoreSettings | null,
  config: NicheConfig
): MenuSeo {
  if (!store) {
    return {
      title: "Cardápio digital",
      description: "Cardápio digital Cosmo Business AI.",
      imageUrl: null,
      url: null,
    };
  }

  const nicheSuffix = config.niche === "generic" ? "Cardápio digital" : config.label;

  return {
    title: `${store.organizationName} · ${nicheSuffix}`,
    description: truncate(
      store.welcomeMessage ||
        `Faça seu pedido no cardápio digital de ${store.organizationName}.`
    ),
    imageUrl: store.bannerUrl ?? store.logoUrl ?? null,
    url:
      typeof window === "undefined"
        ? null
        : `${window.location.origin}/menu/${store.slug}`,
  };
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

/** Document-level SEO without external infrastructure. */
export function applyMenuSeo(seo: MenuSeo) {
  if (typeof document === "undefined") return;

  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:type", "website");

  if (seo.imageUrl) upsertMeta("property", "og:image", seo.imageUrl);
  if (seo.url) upsertMeta("property", "og:url", seo.url);
}
