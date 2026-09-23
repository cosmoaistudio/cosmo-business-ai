import type { MenuTheme } from "../types/digitalMenu.types";
import {
  bannerHeightClass,
  bannerOverlayStyle,
  radiusToCss,
} from "../theme/menuTheme";

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
  if (theme.bannerStyle === "hidden") {
    return null;
  }

  const gradient = `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 55%, color-mix(in srgb, ${theme.accentColor} 55%, ${theme.secondaryColor}) 100%)`;
  const useImage = theme.bannerStyle === "image" && Boolean(imageUrl);
  const heightClass = bannerHeightClass(theme);

  if (theme.bannerStyle === "minimal") {
    return (
      <div
        className="flex items-end justify-between gap-3 px-4 py-2.5"
        data-banner-style="minimal"
        style={{
          backgroundColor: theme.surfaceMuted,
          borderBottom: `1px solid ${theme.borderColor}`,
          borderRadius: radiusToCss(theme.bannerRadius),
        }}
      >
        <div className="min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: theme.mutedTextColor }}
          >
            Cardápio
          </p>
          {message ? (
            <p
              className="mt-1 text-sm font-medium"
              style={{ color: theme.textColor }}
            >
              {message}
            </p>
          ) : (
            <p
              className="mt-1 truncate text-base font-semibold"
              style={{
                color: theme.textColor,
                fontFamily: theme.headingFontFamily,
              }}
            >
              {storeName}
            </p>
          )}
        </div>
        <span
          className="h-1.5 w-12 shrink-0"
          style={{
            backgroundColor: theme.primaryColor,
            borderRadius: radiusToCss(theme.buttonRadius),
          }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden"
      data-banner-style={theme.bannerStyle}
      data-banner-height={theme.bannerHeight}
      style={{ borderRadius: radiusToCss(theme.bannerRadius) }}
    >
      {useImage ? (
        <img
          src={imageUrl ?? undefined}
          alt={`Banner de ${storeName}`}
          loading="eager"
          decoding="async"
          className={`${heightClass} w-full object-cover`}
        />
      ) : (
        <div
          className={`relative ${heightClass} w-full overflow-hidden`}
          style={{ background: gradient }}
          aria-hidden
        >
          <div
            className="absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle, ${theme.accentColor}, transparent 70%)`,
            }}
          />
          <div
            className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full opacity-25"
            style={{
              background: `radial-gradient(circle, ${theme.primaryColor}, transparent 70%)`,
            }}
          />
        </div>
      )}

      {message && theme.bannerOverlay !== "none" ? (
        <div className="absolute inset-x-0 bottom-0">
          <p
            className="px-5 py-3 text-sm font-semibold leading-snug sm:text-base"
            style={bannerOverlayStyle(theme)}
          >
            {message}
          </p>
        </div>
      ) : message ? (
        <div className="absolute inset-x-0 bottom-0 px-5 py-3">
          <p
            className="text-sm font-semibold leading-snug sm:text-base"
            style={{ color: theme.textColor }}
          >
            {message}
          </p>
        </div>
      ) : null}
    </div>
  );
}
