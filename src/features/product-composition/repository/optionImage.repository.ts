import { supabase } from "@/config/supabase";
import { AppError } from "@/lib/errors";
import {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
} from "@/features/products/repository/productImage.repository";

export {
  PRODUCT_IMAGES_BUCKET,
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_BYTES,
};

export function buildOptionImagePath(
  organizationId: string,
  optionId: string,
  timestamp = Date.now()
) {
  return `${organizationId}/options/${optionId}-${timestamp}.webp`;
}

export async function uploadOptionImage(
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

export async function deleteOptionImage(path: string) {
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);

  if (error) throw error;
}

export function getOptionImageUrl(path: string) {
  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function updateOptionImage(
  optionId: string,
  imageUrl: string | null
) {
  const { error } = await supabase
    .from("options")
    .update({ image_url: imageUrl })
    .eq("id", optionId);

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("row-level security") ||
      message.includes("42501") ||
      error.code === "42501"
    ) {
      throw new AppError(
        "Sem permissão para atualizar a imagem do item.",
        "OPTION_IMAGE_FORBIDDEN"
      );
    }

    throw error;
  }
}
