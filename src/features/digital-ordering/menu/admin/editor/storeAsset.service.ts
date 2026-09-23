import { supabase } from "@/config/supabase";
import { AppError } from "@/lib/errors";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGES_BUCKET,
  deleteProductImage,
  getProductImageUrl,
  uploadProductImage,
} from "@/features/products/repository/productImage.repository";
import { extractProductImagePath } from "@/features/products/utils/productImage";
import { convertImageToWebp } from "@/features/products/utils/convertImageToWebp";
import { runStorageAction } from "@/features/products/utils/storageError";
import {
  buildStoreAssetPath,
  isOrganizationId,
  isOwnStoreAssetPath,
  type StoreAssetKind,
} from "./storeAssetPath";

export type { StoreAssetKind };
export { buildStoreAssetPath, isOwnStoreAssetPath, isOrganizationId };

export const STORE_ASSET_MAX_DIMENSION: Record<StoreAssetKind, number> = {
  logo: 800,
  banner: 1600,
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateStoreAssetFile(file: File) {
  const type = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExt = ["jpg", "jpeg", "png", "webp"].includes(ext);
  if (!ALLOWED_TYPES.has(type) || !allowedExt) {
    throw new AppError("Selecione uma imagem JPG, PNG ou WebP válida.");
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new AppError("A imagem deve ter no máximo 3 MB.");
  }
}

export async function assertImageMagicBytes(file: File) {
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47;
  const webp =
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50;
  if (!jpeg && !png && !webp) {
    throw new AppError("O arquivo não parece uma imagem JPG, PNG ou WebP.");
  }
}

async function assertStoreUploadReady(organizationId: string) {
  const org = organizationId.trim();
  if (!isOrganizationId(org)) {
    throw new AppError(
      "Organização não identificada. Recarregue a página e tente novamente.",
      "ORG_INVALID"
    );
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new AppError("Sessão expirada. Faça login novamente.", "AUTH_REQUIRED");
  }

  const { data: myOrg, error: orgError } = await supabase.rpc(
    "get_my_organization_id"
  );
  if (orgError || !myOrg || String(myOrg) !== org) {
    throw new AppError(
      "Sem permissão para enviar arquivos desta organização.",
      "ORG_FORBIDDEN"
    );
  }

  return { organizationId: org, userId: session.user.id };
}

/**
 * Logo/banner upload on the existing public `product-images` bucket.
 * Writes only under `{orgId}/store/`. Persist the public URL via draft/save.
 */
export async function uploadStoreAsset(input: {
  organizationId: string;
  kind: StoreAssetKind;
  file: File;
  previousUrl?: string | null;
  signal?: AbortSignal;
}) {
  validateStoreAssetFile(input.file);
  await assertImageMagicBytes(input.file);
  if (input.signal?.aborted) {
    throw new AppError("Envio cancelado.", "UPLOAD_CANCELLED");
  }

  const ctx = await assertStoreUploadReady(input.organizationId);
  if (input.signal?.aborted) {
    throw new AppError("Envio cancelado.", "UPLOAD_CANCELLED");
  }

  const path = buildStoreAssetPath(ctx.organizationId, input.kind);
  const webp = await convertImageToWebp(input.file, {
    maxDimension: STORE_ASSET_MAX_DIMENSION[input.kind],
  });

  if (webp.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new AppError(
      "A imagem convertida excede 3 MB. Selecione um arquivo menor."
    );
  }

  if (input.signal?.aborted) {
    throw new AppError("Envio cancelado.", "UPLOAD_CANCELLED");
  }

  await runStorageAction(() => uploadProductImage(path, webp));
  if (input.signal?.aborted) {
    await runStorageAction(() => deleteProductImage(path)).catch(() => undefined);
    throw new AppError("Envio cancelado.", "UPLOAD_CANCELLED");
  }
  const publicUrl = getProductImageUrl(path);

  const previousPath = input.previousUrl
    ? extractProductImagePath(input.previousUrl)
    : null;
  if (
    previousPath &&
    previousPath !== path &&
    isOwnStoreAssetPath(previousPath, ctx.organizationId)
  ) {
    await runStorageAction(() => deleteProductImage(previousPath)).catch(
      () => undefined
    );
  }

  return { path, publicUrl, bucket: PRODUCT_IMAGES_BUCKET };
}

export async function removeStoreAsset(
  publicUrl: string | null | undefined,
  organizationId: string
) {
  const path = publicUrl ? extractProductImagePath(publicUrl) : null;
  if (!path || !isOwnStoreAssetPath(path, organizationId)) return;
  await assertStoreUploadReady(organizationId);
  await runStorageAction(() => deleteProductImage(path));
}
