import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { getErrorMessage } from "@/lib/errors";
import { optionImageService } from "../services/optionImage.service";
import type { OptionImageUploadResult } from "../types/optionImage";
import { extractOptionImagePath } from "../utils/optionImage";

interface UseOptionImageOptions {
  optionId: string;
  organizationId: string;
  initialImageUrl?: string;
  initialStoragePath?: string;
  persistToDatabase?: boolean;
  onUploaded?: (result: OptionImageUploadResult) => void;
  onRemoved?: () => void;
}

export function useOptionImage({
  optionId,
  organizationId,
  initialImageUrl = "",
  initialStoragePath = "",
  persistToDatabase = false,
  onUploaded,
  onRemoved,
}: UseOptionImageOptions) {
  const { session, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [storagePath, setStoragePath] = useState(
    initialStoragePath ||
      (initialImageUrl ? extractOptionImagePath(initialImageUrl) ?? "" : "")
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setImageUrl(initialImageUrl);
    setStoragePath(
      initialStoragePath ||
        (initialImageUrl ? extractOptionImagePath(initialImageUrl) ?? "" : "")
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

      if (!optionId?.trim()) {
        toast.error("Item não identificado.");
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

        const result = await optionImageService.upload({
          file,
          optionId,
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
      optionId,
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

      await optionImageService.remove({
        path: storagePath || null,
        publicUrl: imageUrl || null,
        optionId,
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
    optionId,
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
