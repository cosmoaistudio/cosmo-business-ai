import { AppError } from "@/lib/errors";
import {
  buildProductImagePath,
  deleteProductImage,
  getProductImageUrl,
  PRODUCT_IMAGE_MAX_BYTES,
  updateProductImage,
  uploadProductImage,
} from "../repository/productImage.repository";
import type {
  ProductImageUploadResult,
  RemoveProductImageParams,
  UploadProductImageParams,
} from "../types/productImage";
import { extractProductImagePath } from "../utils/productImage";
import { runStorageAction } from "../utils/storageError";
import { assertProductImageUploadReady } from "../utils/uploadContext";
import { convertImageToWebp } from "../utils/convertImageToWebp";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isAllowedImageFile(file: File) {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) return true;

  const extension = getFileExtension(file.name);
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

function validateImageFile(file: File) {
  if (!isAllowedImageFile(file)) {
    throw new AppError("Selecione uma imagem JPG, JPEG, PNG ou WebP.");
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new AppError("A imagem deve ter no máximo 3 MB.");
  }
}

function resolveStoragePath(
  path?: string | null,
  publicUrl?: string | null
) {
  if (path?.trim()) return path.trim();
  if (publicUrl?.trim()) return extractProductImagePath(publicUrl.trim());
  return null;
}

export class ProductImageService {
  static validateImageFile = validateImageFile;

  static buildStoragePath(organizationId: string, productId: string) {
    return buildProductImagePath(organizationId, productId);
  }

  static resolvePublicUrl(path: string) {
    return getProductImageUrl(path);
  }

  static extractPathFromUrl(publicUrl: string) {
    return extractProductImagePath(publicUrl);
  }

  static async upload(
    params: UploadProductImageParams
  ): Promise<ProductImageUploadResult> {
    validateImageFile(params.file);

    const uploadContext = await assertProductImageUploadReady({
      organizationId: params.organizationId,
      productId: params.productId,
    });

    const path = buildProductImagePath(
      uploadContext.organizationId,
      uploadContext.productId
    );

    const webpBlob = await convertImageToWebp(params.file).catch((error) => {
      if (error instanceof AppError) throw error;
      throw new AppError(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a imagem."
      );
    });

    if (webpBlob.size > PRODUCT_IMAGE_MAX_BYTES) {
      throw new AppError(
        "A imagem convertida excede 3 MB. Selecione um arquivo menor."
      );
    }

    await runStorageAction(() => uploadProductImage(path, webpBlob));

    const publicUrl = getProductImageUrl(path);

    if (params.persistToDatabase) {
      try {
        await updateProductImage(uploadContext.productId, publicUrl);
      } catch (error) {
        await runStorageAction(() => deleteProductImage(path)).catch(
          () => undefined
        );
        throw error;
      }
    }

    const previousPath = resolveStoragePath(params.previousPath);

    if (previousPath && previousPath !== path) {
      await runStorageAction(() => deleteProductImage(previousPath)).catch(
        () => undefined
      );
    }

    return { path, publicUrl };
  }

  static async remove(params: RemoveProductImageParams) {
    if (params.productId && params.organizationId) {
      await assertProductImageUploadReady({
        organizationId: params.organizationId,
        productId: params.productId,
      });
    }

    const storagePath = resolveStoragePath(params.path, params.publicUrl);

    if (storagePath) {
      await runStorageAction(() => deleteProductImage(storagePath));
    }

    if (params.persistToDatabase && params.productId) {
      await updateProductImage(params.productId, null);
    }
  }
}

export const productImageService = ProductImageService;
