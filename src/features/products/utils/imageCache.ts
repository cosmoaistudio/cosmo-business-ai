const loadedUrls = new Set<string>();

export function markImageCached(url: string) {
  if (!url) return;
  loadedUrls.add(url);
}

export function isImageCached(url: string) {
  return loadedUrls.has(url);
}

export function preloadImage(url: string) {
  if (!url || isImageCached(url)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      markImageCached(url);
      resolve();
    };

    image.onerror = () => {
      reject(new Error("Não foi possível carregar a imagem."));
    };

    image.src = url;
  });
}
