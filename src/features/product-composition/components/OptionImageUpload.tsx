import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  ImageIcon,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { PRODUCT_IMAGE_ACCEPT } from "../repository/optionImage.repository";
import { optionImageService } from "../services/optionImage.service";
import { useOptionImage } from "../hooks/useOptionImage";

interface OptionImageUploadProps {
  optionId: string;
  organizationId: string;
  imageUrl?: string;
  disabled?: boolean;
  persistToDatabase?: boolean;
  onUploaded?: (publicUrl: string) => void;
  onRemoved?: () => void;
}

export default function OptionImageUpload({
  optionId,
  organizationId,
  imageUrl = "",
  disabled = false,
  persistToDatabase = false,
  onUploaded,
  onRemoved,
}: OptionImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    imageUrl: currentImageUrl,
    previewUrl,
    uploading,
    removing,
    loading,
    upload,
    remove,
  } = useOptionImage({
    optionId,
    organizationId,
    initialImageUrl: imageUrl,
    persistToDatabase,
    onUploaded: (result) => onUploaded?.(result.publicUrl),
    onRemoved,
  });

  const isBusy = uploading || removing;
  const isDisabled =
    disabled || isBusy || !organizationId || !optionId || loading;
  const displayUrl = previewUrl || currentImageUrl;
  const hasPreview = Boolean(displayUrl);

  const processFile = useCallback(
    async (file: File) => {
      try {
        optionImageService.validateImageFile(file);
      } catch (error) {
        toast.error(getErrorMessage(error, "Arquivo de imagem inválido"));
        return;
      }

      await upload(file);
    },
    [upload]
  );

  function openFilePicker() {
    if (isDisabled) return;
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await processFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (isDisabled) return;
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isDisabled) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  }

  function handleRemove() {
    void remove();
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label="Área de upload de imagem do item"
        aria-busy={isBusy}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onClick={() => {
          if (!hasPreview && !isDisabled) openFilePicker();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl border border-dashed p-4 transition-all duration-300 ease-out sm:p-6 ${
          isDragging
            ? "scale-[1.01] border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
            : "border-slate-300 bg-slate-50"
        } ${
          !hasPreview && !isDisabled
            ? "cursor-pointer hover:border-blue-400 hover:bg-blue-50/70 hover:shadow-sm"
            : ""
        } ${hasPreview && !isDisabled ? "hover:border-slate-400 hover:bg-slate-100/80" : ""}`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="group relative">
            {hasPreview ? (
              <img
                src={displayUrl}
                alt="Preview da imagem do item"
                loading="eager"
                decoding="async"
                className="h-36 w-36 rounded-2xl object-cover shadow-md ring-1 ring-slate-200/80 transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-lg sm:h-44 sm:w-44"
              />
            ) : (
              <div className="flex h-36 w-36 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all duration-300 ease-out hover:border-blue-200 hover:text-blue-500 sm:h-44 sm:w-44">
                <ImagePlus
                  size={36}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <ImageIcon size={24} className="opacity-60" />
              </div>
            )}

            {isBusy && (
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/45 backdrop-blur-[2px]"
                aria-live="polite"
                aria-label={uploading ? "Enviando imagem" : "Removendo imagem"}
              >
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="max-w-sm px-1">
            <p className="text-sm font-medium text-slate-700">Imagem do item</p>
            <p className="mt-1 text-xs text-slate-500">
              Arraste uma imagem ou clique para selecionar
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PNG, JPG, JPEG ou WebP · convertido para WebP · máximo 3 MB
            </p>
          </div>

          {!hasPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-xl"
              disabled={isDisabled}
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploading ? "Enviando..." : "Selecionar imagem"}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="hidden"
        disabled={isDisabled}
        onChange={handleFileChange}
      />

      {hasPreview && (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl"
            disabled={isDisabled}
            onClick={openFilePicker}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {uploading ? "Enviando..." : "Trocar imagem"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl text-red-600 hover:border-red-200 hover:bg-red-50"
            disabled={isDisabled}
            onClick={handleRemove}
          >
            {removing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {removing ? "Removendo..." : "Remover"}
          </Button>
        </div>
      )}
    </div>
  );
}
