import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { getErrorMessage } from "@/lib/errors";
import { productImageService } from "../services/productImage.service";
import type { ProductImageUploadResult } from "../types/productImage";
import { extractProductImagePath } from "../utils/productImage";

interface UseProductImageOptions {
  productId: string;
  organizationId: string;
  initialImageUrl?: string;
  initialStoragePath?: string;
  persistToDatabase?: boolean;
  onUploaded?: (result: ProductImageUploadResult) => void;
  onRemoved?: () => void;
}

export function useProductImage({
  productId,
  organizationId,
  initialImageUrl = "",
  initialStoragePath = "",
  persistToDatabase = false,
  onUploaded,
  onRemoved,
}: UseProductImageOptions) {
  const { session, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [storagePath, setStoragePath] = useState(
    initialStoragePath ||
      (initialImageUrl ? extractProductImagePath(initialImageUrl) ?? "" : "")
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setImageUrl(initialImageUrl);
    setStoragePath(
      initialStoragePath ||
        (initialImageUrl ? extractProductImagePath(initialImageUrl) ?? "" : "")
    );
  }, [initialImageUrl, initialStoragePath]);

  const upload = useCallback(
    async (file: File) => {
      if (authLoading) {
        toast.error("Aguarde o carregamento da sessão.");
        return null;
      }

      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return null;
      }

      if (!productId?.trim()) {
        toast.error("Produto não identificado.");
        return null;
      }

      if (!organizationId?.trim()) {
        toast.error(
          "Organização não identificada. Recarregue a página e tente novamente."
        );
        return null;
      }

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        setUploading(true);

        const result = await productImageService.upload({
          file,
          productId,
          organizationId,
          previousPath: storagePath || null,
          persistToDatabase,
        });

        setImageUrl(result.publicUrl);
        setStoragePath(result.path);
        onUploaded?.(result);

        toast.success("Imagem enviada.");
        return result;
      } catch (error) {
        toast.error(getErrorMessage(error, "Erro ao enviar imagem"));
        return null;
      } finally {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        setUploading(false);
      }
    },
    [
      authLoading,
      organizationId,
      onUploaded,
      persistToDatabase,
      productId,
      session,
      storagePath,
    ]
  );

  const remove = useCallback(async () => {
    if (!storagePath && !imageUrl) {
      setImageUrl("");
      onRemoved?.();
      return true;
    }

    if (authLoading) {
      toast.error("Aguarde o carregamento da sessão.");
      return false;
    }

    if (!session) {
      toast.error("Sessão expirada. Faça login novamente.");
      return false;
    }

    try {
      setRemoving(true);

      await productImageService.remove({
        path: storagePath || null,
        publicUrl: imageUrl || null,
        productId,
        organizationId,
        persistToDatabase,
      });

      setImageUrl("");
      setStoragePath("");
      onRemoved?.();
      toast.success("Imagem removida.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao remover imagem"));
      return false;
    } finally {
      setRemoving(false);
    }
  }, [
    authLoading,
    imageUrl,
    onRemoved,
    organizationId,
    persistToDatabase,
    productId,
    session,
    storagePath,
  ]);

  return {
    imageUrl,
    previewUrl,
    storagePath,
    uploading,
    removing,
    loading: uploading || removing || authLoading,
    upload,
    remove,
    setImageUrl,
    setStoragePath,
  };
}
