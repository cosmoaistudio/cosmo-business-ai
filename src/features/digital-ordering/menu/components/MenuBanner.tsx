import type { MenuTheme } from "../types/digitalMenu.types";

interface MenuBannerProps {
  imageUrl: string | null;
  message: string | null;
  storeName: string;
  theme: MenuTheme;
}

export default function MenuBanner({
  imageUrl,
  message,
  storeName,
  theme,
}: MenuBannerProps) {
  const gradient = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`;
  const useImage = theme.bannerStyle === "image" && Boolean(imageUrl);

  if (theme.bannerStyle === "minimal") {
    return message ? (
      <div
        className="px-5 py-3 text-sm font-medium"
        style={{ backgroundColor: theme.surfaceColor, color: theme.textColor }}
      >
        {message}
      </div>
    ) : null;
  }

  return (
    <div className="relative">
      {useImage ? (
        <img
          src={imageUrl ?? undefined}
          alt={`Banner de ${storeName}`}
          loading="eager"
          decoding="async"
          className="h-36 w-full object-cover sm:h-44"
        />
      ) : (
        <div className="h-28 w-full sm:h-32" style={{ background: gradient }} />
      )}

      {message && (
        <div className="absolute inset-x-0 bottom-0">
          <p
            className="px-5 py-2.5 text-sm font-semibold"
            style={{
              // Keeps the promo readable over arbitrary artwork.
              background:
                "linear-gradient(to top, rgba(2, 6, 23, 0.88), rgba(2, 6, 23, 0))",
              color: "#ffffff",
            }}
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
