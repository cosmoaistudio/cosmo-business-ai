import { cn } from "@/lib/utils";

export function DesignAvatar({
  initials,
  src,
  size = "md",
  className,
}: {
  initials: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover ring-2 ring-blue-500/30", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white ring-2 ring-blue-500/20",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
