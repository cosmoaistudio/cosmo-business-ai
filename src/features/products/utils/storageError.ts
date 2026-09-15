import { AppError } from "@/lib/errors";

interface StorageErrorLike {
  message?: string;
  statusCode?: number | string;
  status?: number;
  error?: string;
  name?: string;
}

function asStorageError(error: unknown): StorageErrorLike | null {
  if (!error || typeof error !== "object") return null;
  return error as StorageErrorLike;
}

function getStatusCode(error: unknown) {
  const storageError = asStorageError(error);
  if (!storageError) return undefined;

  const rawStatus = storageError.statusCode ?? storageError.status;
  if (typeof rawStatus === "number") return rawStatus;
  if (typeof rawStatus === "string") return Number.parseInt(rawStatus, 10);

  return undefined;
}

function getErrorCode(error: unknown) {
  const storageError = asStorageError(error);
  return storageError?.error?.trim() ?? "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.trim();
  if (typeof error === "string") return error.trim();

  const storageError = asStorageError(error);
  return storageError?.message?.trim() ?? "";
}

function isBucketNotConfiguredError(error: unknown, message: string) {
  const errorCode = getErrorCode(error);
  const statusCode = getStatusCode(error);
  const normalizedMessage = message.toLowerCase();

  if (errorCode === "NoSuchBucket") {
    return true;
  }

  if (
    statusCode === 404 &&
    /^bucket not found$/i.test(normalizedMessage)
  ) {
    return true;
  }

  if (
    normalizedMessage.includes("storage api is not enabled") ||
    normalizedMessage.includes("storage is not enabled")
  ) {
    return true;
  }

  return false;
}

export function mapStorageError(error: unknown): AppError {
  const message = getErrorMessage(error);
  const normalizedMessage = message.toLowerCase();
  const statusCode = getStatusCode(error);
  const errorCode = getErrorCode(error);

  if (isBucketNotConfiguredError(error, message)) {
    return new AppError(
      "Armazenamento de imagens não configurado. Contate o administrador.",
      "STORAGE_NOT_CONFIGURED"
    );
  }

  if (
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("42501") ||
    errorCode === "AccessDenied" ||
    statusCode === 403
  ) {
    return new AppError(
      "Sem permissão para gerenciar imagens de produtos. Verifique se você está autenticado.",
      "STORAGE_FORBIDDEN"
    );
  }

  if (
    normalizedMessage.includes("invalid jwt") ||
    normalizedMessage.includes("jwt expired") ||
    statusCode === 401
  ) {
    return new AppError(
      "Sessão expirada. Faça login novamente.",
      "AUTH_REQUIRED"
    );
  }

  if (
    normalizedMessage.includes("payload too large") ||
    normalizedMessage.includes("maximum allowed size") ||
    normalizedMessage.includes("entity too large") ||
    errorCode === "EntityTooLarge"
  ) {
    return new AppError("A imagem deve ter no máximo 3 MB.", "FILE_TOO_LARGE");
  }

  if (
    normalizedMessage.includes("invalid mime type") ||
    normalizedMessage.includes("mime type") ||
    errorCode === "InvalidMimeType"
  ) {
    return new AppError("Formato de imagem não permitido.", "INVALID_MIME");
  }

  if (
    normalizedMessage.includes("the resource already exists") ||
    errorCode === "Duplicate"
  ) {
    return new AppError(
      "Esta imagem já foi enviada. Tente novamente.",
      "DUPLICATE_FILE"
    );
  }

  if (
    normalizedMessage.includes("object not found") ||
    errorCode === "NoSuchKey"
  ) {
    return new AppError(
      "Imagem não encontrada no armazenamento.",
      "OBJECT_NOT_FOUND"
    );
  }

  if (message) {
    return new AppError(message);
  }

  return new AppError(
    "Erro ao processar a imagem. Tente novamente.",
    "STORAGE_UNKNOWN"
  );
}

export async function runStorageAction<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mapStorageError(error);
  }
}
