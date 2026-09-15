import { supabase } from "@/config/supabase";
import { AppError } from "@/lib/errors";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export const PRODUCT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const PRODUCT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

export function buildProductImagePath(
  organizationId: string,
  productId: string,
  timestamp = Date.now()
) {
  return `${organizationId}/${productId}-${timestamp}.webp`;
}

export async function uploadProductImage(
  path: string,
  body: Blob | File,
  contentType = "image/webp"
) {
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, body, {
      cacheControl: "86400",
      upsert: false,
      contentType,
    });

  if (error) throw error;

  return data;
}

export async function deleteProductImage(path: string) {
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);

  if (error) throw error;
}

export function getProductImageUrl(path: string) {
  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function updateProductImage(
  productId: string,
  imageUrl: string | null
) {
  const { error } = await supabase
    .from("products")
    .update({ image_url: imageUrl })
    .eq("id", productId);

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("row-level security") ||
      message.includes("42501") ||
      error.code === "42501"
    ) {
      throw new AppError(
        "Sem permissão para atualizar a imagem do produto.",
        "PRODUCT_IMAGE_FORBIDDEN"
      );
    }

    throw error;
  }
}
