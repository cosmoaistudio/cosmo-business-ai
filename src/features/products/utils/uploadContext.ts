import { supabase } from "@/config/supabase";
import { AppError } from "@/lib/errors";
import {
  PRODUCT_IMAGES_BUCKET,
  buildProductImagePath,
} from "../repository/productImage.repository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function assertProductImageUploadReady(input: {
  organizationId: string;
  productId: string;
}) {
  const organizationId = input.organizationId.trim();
  const productId = input.productId.trim();

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

  if (!productId) {
    throw new AppError("Produto não identificado.", "PRODUCT_MISSING");
  }

  if (!UUID_PATTERN.test(productId)) {
    throw new AppError("Produto inválido.", "PRODUCT_INVALID");
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

  const path = buildProductImagePath(organizationId, productId);

  if (!path.startsWith(`${organizationId}/`)) {
    throw new AppError("Caminho de upload inválido.", "STORAGE_PATH_INVALID");
  }

  return {
    organizationId,
    productId,
    path,
    bucket: PRODUCT_IMAGES_BUCKET,
    userId: session.user.id,
  };
}
