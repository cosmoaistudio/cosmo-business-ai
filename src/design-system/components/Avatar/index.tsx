import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: "cosmo-v2-avatar--sm",
  md: "cosmo-v2-avatar--md",
  lg: "cosmo-v2-avatar--lg",
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  src,
  alt = "",
  fallback = "?",
  size = "md",
  className,
}: AvatarProps) {
  return (
    <span className={cn("cosmo-v2-avatar", sizeClass[size], className)}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        getInitials(fallback) || fallback.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
