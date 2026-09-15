import { useState } from "react";
import { cn } from "@/lib/utils";
import { getOrganizationInitials } from "@/lib/organizationInitials";

export type OrganizationAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<OrganizationAvatarSize, string> = {
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-14 w-14 text-base",
};

interface OrganizationAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: OrganizationAvatarSize;
  className?: string;
}

/**
 * Establishment avatar: logo_url → image; missing/broken → initials.
 */
export function OrganizationAvatar({
  name,
  logoUrl,
  size = "lg",
  className,
}: OrganizationAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getOrganizationInitials(name);
  const trimmedLogo = logoUrl?.trim() || "";
  const showImage = Boolean(trimmedLogo) && !imageFailed;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-blue-600 to-violet-600 font-bold text-white",
        "ring-1 ring-white/15 shadow-lg shadow-indigo-950/40",
        SIZE_CLASS[size],
        className
      )}
      aria-hidden={!showImage}
    >
      {showImage ? (
        <img
          src={trimmedLogo}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="select-none tracking-wide">{initials}</span>
      )}
    </div>
  );
}
