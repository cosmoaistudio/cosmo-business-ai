import { extractProductImagePath } from "@/features/products/utils/productImage";

export function resolveOptionImage(option: { image_url?: string | null }) {
  return option.image_url?.trim() || "";
}

export function extractOptionImagePath(publicUrl: string) {
  return extractProductImagePath(publicUrl);
}
