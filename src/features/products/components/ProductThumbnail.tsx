import { Package } from "lucide-react";
import { markImageCached } from "../utils/imageCache";
import { resolveProductImage } from "../utils/productImage";

interface ProductThumbnailProps {
  product: {
    name: string;
    image_url?: string | null;
    image?: string | null;
  };
  size?: "xs" | "sm" | "md" | "pdv";
}

const sizeClasses = {
  xs: "h-10 w-10 rounded-lg",
  sm: "h-12 w-12 rounded-xl",
  md: "h-16 w-16 rounded-2xl",
  pdv: "h-20 w-20 rounded-2xl",
};

const iconSizes = {
  xs: 16,
  sm: 18,
  md: 24,
  pdv: 28,
} as const;

export default function ProductThumbnail({
  product,
  size = "md",
}: ProductThumbnailProps) {
  const className = `${sizeClasses[size]} shrink-0 overflow-hidden bg-blue-50`;
  const imageUrl = resolveProductImage(product);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className={`${className} object-cover`}
        onLoad={() => markImageCached(imageUrl)}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center text-blue-600`}
    >
      <Package size={iconSizes[size]} />
    </div>
  );
}
