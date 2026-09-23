export const PRODUCT_IMAGE_MAX_DIMENSION = 800;
export const PRODUCT_IMAGE_WEBP_QUALITY = 0.8;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler a imagem selecionada."));
    };

    image.src = objectUrl;
  });
}

function computeTargetDimensions(
  width: number,
  height: number,
  maxDimension = PRODUCT_IMAGE_MAX_DIMENSION
) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToWebpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível converter a imagem para WebP."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      PRODUCT_IMAGE_WEBP_QUALITY
    );
  });
}

export async function convertImageToWebp(
  file: File,
  options?: { maxDimension?: number }
): Promise<Blob> {
  const image = await loadImageFromFile(file);
  const { width, height } = computeTargetDimensions(
    image.naturalWidth,
    image.naturalHeight,
    options?.maxDimension
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível processar a imagem.");
  }

  context.drawImage(image, 0, 0, width, height);

  return canvasToWebpBlob(canvas);
}
