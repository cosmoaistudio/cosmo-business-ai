import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { DIGITAL_ORDER_MODE_LABELS } from "../types/digitalOrdering.types";
import type { DigitalOrderMode } from "../types/digitalStore.types";
import MenuBanner from "../menu/components/MenuBanner";
import MenuStoreMeta from "../menu/components/MenuStoreMeta";
import { isDefaultWelcomeMessage } from "../menu/core/storeMeta";
import { resolveStoreStatus } from "../menu/core/storeStatus";
import { resolveMenuScrollContainer } from "../menu/core/menuSectionNav";
import { useMenuTheme } from "../menu/hooks/useMenuTheme";
import {
  fontWeightCss,
  logoSizeClass,
  radiusToCss,
  shadowFor,
} from "../menu/theme/menuTheme";
import MenuPreviewRegion from "../menu/admin/editor/MenuPreviewRegion";

interface DigitalStoreHeaderProps {
  store: DigitalStoreSettings;
  mode?: DigitalOrderMode;
  tableLabel?: string;
}

export default function DigitalStoreHeader({
  store,
  mode,
  tableLabel,
}: DigitalStoreHeaderProps) {
  const { theme } = useMenuTheme(store);
  const headerRef = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const currentMode = mode ?? "pickup";

  useEffect(() => {
    const container = resolveMenuScrollContainer(headerRef.current);
    const readTop = () =>
      container instanceof HTMLElement ? container.scrollTop : window.scrollY;
    const onScroll = () => setScrolled(readTop() > 8);
    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const applyOffset = () => {
      document.documentElement.style.setProperty(
        "--digital-header-offset",
        `${header.offsetHeight}px`
      );
    };

    applyOffset();
    if (typeof ResizeObserver === "undefined") {
      return () => {
        document.documentElement.style.removeProperty("--digital-header-offset");
      };
    }
    const observer = new ResizeObserver(applyOffset);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--digital-header-offset");
    };
  }, []);

  const status = resolveStoreStatus(store, currentMode);
  const centered = theme.headerAlign === "center";
  const logoClass = logoSizeClass(theme);
  const showWelcome = !isDefaultWelcomeMessage(store.welcomeMessage);

  return (
    <>
      <MenuPreviewRegion id="banner">
        <MenuBanner
          imageUrl={store.bannerUrl}
          message={store.bannerMessage}
          storeName={store.organizationName}
          theme={theme}
        />
      </MenuPreviewRegion>

    <header
      ref={headerRef}
      className="sticky top-0 z-30 mb-3 min-w-0 overflow-hidden border backdrop-blur-md"
      style={{
        backgroundColor: scrolled
          ? theme.surfaceElevated
          : theme.surfaceColor,
        borderColor: theme.borderColor,
        borderRadius: radiusToCss(theme.cardRadius),
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        boxShadow: scrolled ? shadowFor(theme) : "none",
      }}
    >
      <MenuPreviewRegion id="header">
      <div
        className={`flex min-w-0 gap-3 px-3 py-2.5 sm:px-4 ${
          centered ? "flex-col items-center text-center" : "items-center"
        }`}
      >
        {store.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={store.organizationName}
            loading="eager"
            decoding="async"
            className={`${logoClass} shrink-0 border object-cover`}
            style={{
              borderColor: theme.borderColor,
              borderRadius: radiusToCss(theme.cardRadius),
              boxShadow: shadowFor(theme),
            }}
          />
        ) : (
          <div
            className={`flex ${logoClass} shrink-0 items-center justify-center text-lg font-bold text-white sm:text-xl`}
            style={{
              backgroundColor: theme.primaryColor,
              borderRadius: radiusToCss(theme.cardRadius),
              boxShadow: shadowFor(theme),
            }}
            aria-hidden="true"
          >
            {store.organizationName.charAt(0)}
          </div>
        )}

        <div className={`min-w-0 ${centered ? "" : "flex-1"}`}>
          <div
            className={`flex min-w-0 flex-wrap items-center gap-2 ${
              centered ? "justify-center" : ""
            }`}
          >
            <h1
              className="truncate text-lg font-semibold tracking-tight sm:text-xl"
              style={{
                fontFamily: theme.headingFontFamily,
                fontWeight: fontWeightCss(theme.headingFontWeight),
              }}
            >
              {store.organizationName}
            </h1>

            {mode ? (
              <span
                className="inline-flex shrink-0 px-2.5 py-0.5 text-[11px] font-semibold"
                data-store-channel=""
                style={{
                  backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 18%, transparent)`,
                  color: theme.textColor,
                  borderRadius: radiusToCss(theme.buttonRadius),
                  border: `1px solid color-mix(in srgb, ${theme.primaryColor} 35%, transparent)`,
                }}
              >
                {DIGITAL_ORDER_MODE_LABELS[mode]}
                {tableLabel ? ` · ${tableLabel}` : ""}
              </span>
            ) : null}
          </div>

          {showWelcome ? (
            <p
              className="mt-0.5 line-clamp-1 text-xs"
              style={{
                color: theme.mutedTextColor,
                fontWeight: fontWeightCss(theme.bodyFontWeight),
              }}
            >
              {store.welcomeMessage}
            </p>
          ) : null}

          <div className={`mt-1.5 ${centered ? "flex justify-center" : ""}`}>
            <MenuStoreMeta
              store={store}
              mode={currentMode}
              status={status}
              theme={theme}
              compact
            />
          </div>
        </div>
      </div>
      </MenuPreviewRegion>
    </header>
    </>
  );
}
