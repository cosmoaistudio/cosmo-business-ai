import { AppError } from "@/lib/errors";
import { convertImageToWebp } from "@/features/products/utils/convertImageToWebp";
import { runStorageAction } from "@/features/products/utils/storageError";
import {
  buildOptionImagePath,
  deleteOptionImage,
  getOptionImageUrl,
  PRODUCT_IMAGE_MAX_BYTES,
  updateOptionImage,
  uploadOptionImage,
} from "../repository/optionImage.repository";
import type {
  OptionImageUploadResult,
  RemoveOptionImageParams,
  UploadOptionImageParams,
} from "../types/optionImage";
import { extractOptionImagePath } from "../utils/optionImage";
import { assertOptionImageUploadReady } from "../utils/uploadContext";

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
  if (publicUrl?.trim()) return extractOptionImagePath(publicUrl.trim());
  return null;
}

export class OptionImageService {
  static validateImageFile = validateImageFile;

  static buildStoragePath(organizationId: string, optionId: string) {
    return buildOptionImagePath(organizationId, optionId);
  }

  static resolvePublicUrl(path: string) {
    return getOptionImageUrl(path);
  }

  static extractPathFromUrl(publicUrl: string) {
    return extractOptionImagePath(publicUrl);
  }

  static async upload(
    params: UploadOptionImageParams
  ): Promise<OptionImageUploadResult> {
    validateImageFile(params.file);

    const uploadContext = await assertOptionImageUploadReady({
      organizationId: params.organizationId,
      optionId: params.optionId,
    });

    const path = buildOptionImagePath(
      uploadContext.organizationId,
      uploadContext.optionId
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

    await runStorageAction(() => uploadOptionImage(path, webpBlob));

    const publicUrl = getOptionImageUrl(path);

    if (params.persistToDatabase) {
      try {
        await updateOptionImage(uploadContext.optionId, publicUrl);
      } catch (error) {
        await runStorageAction(() => deleteOptionImage(path)).catch(
          () => undefined
        );
        throw error;
      }
    }

    const previousPath = resolveStoragePath(params.previousPath);

    if (previousPath && previousPath !== path) {
      await runStorageAction(() => deleteOptionImage(previousPath)).catch(
        () => undefined
      );
    }

    return { path, publicUrl };
  }

  static async remove(params: RemoveOptionImageParams) {
    if (params.optionId && params.organizationId) {
      await assertOptionImageUploadReady({
        organizationId: params.organizationId,
        optionId: params.optionId,
      });
    }

    const storagePath = resolveStoragePath(params.path, params.publicUrl);

    if (storagePath) {
      await runStorageAction(() => deleteOptionImage(storagePath));
    }

    if (params.persistToDatabase && params.optionId) {
      await updateOptionImage(params.optionId, null);
    }
  }
}

export const optionImageService = OptionImageService;
