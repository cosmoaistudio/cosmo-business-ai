import { supabase } from "@/config/supabase";
import { AppError } from "@/lib/errors";
import {
  PRODUCT_IMAGES_BUCKET,
  buildOptionImagePath,
} from "../repository/optionImage.repository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function assertOptionImageUploadReady(input: {
  organizationId: string;
  optionId: string;
}) {
  const organizationId = input.organizationId.trim();
  const optionId = input.optionId.trim();

  if (!organizationId) {
    throw new AppError(
      "Organização não identificada. Recarregue a página e tente novamente.",
      "ORG_MISSING"
    );
  }

  if (!UUID_PATTERN.test(organizationId)) {
    throw new AppError(
      "Organização inválida. Recarregue a página e tente novamente.",
      "ORG_INVALID"
    );
  }

  if (!optionId) {
    throw new AppError("Item não identificado.", "OPTION_MISSING");
  }

  if (!UUID_PATTERN.test(optionId)) {
    throw new AppError("Item inválido.", "OPTION_INVALID");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new AppError(
      "Não foi possível validar a sessão. Faça login novamente.",
      "AUTH_SESSION_ERROR"
    );
  }

  if (!session?.access_token) {
    throw new AppError(
      "Sessão expirada. Faça login novamente.",
      "AUTH_REQUIRED"
    );
  }

  const path = buildOptionImagePath(organizationId, optionId);

  if (!path.startsWith(`${organizationId}/options/`)) {
    throw new AppError("Caminho de upload inválido.", "STORAGE_PATH_INVALID");
  }

  return {
    organizationId,
    optionId,
    path,
    bucket: PRODUCT_IMAGES_BUCKET,
    userId: session.user.id,
  };
}
