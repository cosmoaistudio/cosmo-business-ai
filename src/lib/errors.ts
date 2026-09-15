import { logger } from "./logger";

export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado.") {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export function handleAppError(context: string, error: unknown) {
  const message = getErrorMessage(error);
  logger.error(context, error);
  return message;
}

export class AppError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}
