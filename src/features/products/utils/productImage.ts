import { PRODUCT_IMAGES_BUCKET } from "../repository/productImage.repository";

const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";

const LEGACY_BUCKETS = ["products", PRODUCT_IMAGES_BUCKET];

export function resolveProductImage(product: {
  image_url?: string | null;
  image?: string | null;
}) {
  return product.image_url?.trim() || product.image?.trim() || "";
}

export function extractProductImagePath(publicUrl: string) {
  const normalizedUrl = publicUrl.trim();
  if (!normalizedUrl) return null;

  for (const bucket of LEGACY_BUCKETS) {
    const marker = `${PUBLIC_OBJECT_PREFIX}${bucket}/`;
    const index = normalizedUrl.indexOf(marker);

    if (index !== -1) {
      return decodeURIComponent(normalizedUrl.slice(index + marker.length));
    }
  }

  return null;
}
