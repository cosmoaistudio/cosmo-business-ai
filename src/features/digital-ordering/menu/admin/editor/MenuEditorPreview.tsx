import { useDeferredValue, useRef, useState } from "react";
import {
  Eye,
  Loader2,
  Minus,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Smartphone,
  Sun,
  Tablet,
  X,
} from "lucide-react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import { DigitalOrderingProvider } from "../../../context/DigitalOrderingContext";
import DigitalOrderingExperience from "../../../components/DigitalOrderingExperience";
import { useMenuTheme } from "../../hooks/useMenuTheme";
import { MenuPreviewSelectProvider } from "./MenuPreviewSelectContext";
import {
  nextZoom,
  type MenuEditorColorMode,
  type MenuEditorFrameWidth,
  type MenuEditorViewport,
  type MenuEditorZoom,
  type MenuPreviewInteraction,
  type MenuPreviewSelectable,
} from "./menuEditor.types";

interface MenuEditorPreviewProps {
  settings: DigitalStoreSettings;
  products: DigitalMenuProduct[];
  loading?: boolean;
  viewport?: MenuEditorViewport;
  onViewportChange?: (viewport: MenuEditorViewport) => void;
  zoom?: MenuEditorZoom;
  onZoomChange?: (zoom: MenuEditorZoom) => void;
  selectedTarget?: MenuPreviewSelectable | null;
  onSelectTarget?: (target: MenuPreviewSelectable) => void;
  interaction?: MenuPreviewInteraction;
  onInteractionChange?: (mode: MenuPreviewInteraction) => void;
  previewInspect?: "productsheet" | "checkout" | null;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  showSheetTrigger?: boolean;
  /** Larger center-stage presentation in the shell. */
  prominent?: boolean;
}

const VIEWPORT_DEFAULT_WIDTH: Record<MenuEditorViewport, MenuEditorFrameWidth> =
  {
    mobile: 390,
    tablet: 768,
    desktop: 1280,
  };

const VIEWPORT_FRAMES: Record<MenuEditorViewport, MenuEditorFrameWidth[]> = {
  mobile: [375, 390, 430],
  tablet: [768],
  desktop: [1024, 1280, 1440],
};

const VIEWPORT_HEIGHT: Record<MenuEditorViewport, number> = {
  mobile: 760,
  tablet: 900,
  desktop: 800,
};

function frameChrome(viewport: MenuEditorViewport, width: number) {
  if (viewport === "mobile") {
    return { radius: "2.25rem", bezel: "10px", height: VIEWPORT_HEIGHT.mobile, width };
  }
  if (viewport === "tablet") {
    return { radius: "1.75rem", bezel: "12px", height: VIEWPORT_HEIGHT.tablet, width };
  }
  return { radius: "1.25rem", bezel: "8px", height: VIEWPORT_HEIGHT.desktop, width };
}

/**
 * Live PREVIEW using the real menu engine.
 * Interactive browsing allowed; place_order blocked via previewMode.
 */
export default function MenuEditorPreview({
  settings,
  products,
  loading = false,
  viewport: controlledViewport,
  onViewportChange,
  zoom: controlledZoom,
  onZoomChange,
  selectedTarget = null,
  onSelectTarget,
  interaction: controlledInteraction,
  onInteractionChange,
  previewInspect = null,
  sheetOpen,
  onSheetOpenChange,
  showSheetTrigger = false,
  prominent = false,
}: MenuEditorPreviewProps) {
  const { theme } = useMenuTheme(settings);
  const [localViewport, setLocalViewport] =
    useState<MenuEditorViewport>("mobile");
  const [localZoom, setLocalZoom] = useState<MenuEditorZoom>(75);
  const [colorMode, setColorMode] = useState<MenuEditorColorMode>("dark");
  const [localInteraction, setLocalInteraction] =
    useState<MenuPreviewInteraction>("edit");
  const [frameWidth, setFrameWidth] = useState<MenuEditorFrameWidth>(390);

  const viewport = controlledViewport ?? localViewport;
  const zoom = controlledZoom ?? localZoom;
  const interaction = controlledInteraction ?? localInteraction;
  const previewSettings = useDeferredValue(settings);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const setViewport = (next: MenuEditorViewport) => {
    onViewportChange?.(next);
    if (controlledViewport === undefined) setLocalViewport(next);
    setFrameWidth(VIEWPORT_DEFAULT_WIDTH[next]);
  };

  const setZoom = (next: MenuEditorZoom) => {
    onZoomChange?.(next);
    if (controlledZoom === undefined) setLocalZoom(next);
  };

  const setInteraction = (next: MenuPreviewInteraction) => {
    onInteractionChange?.(next);
    if (controlledInteraction === undefined) setLocalInteraction(next);
  };

  const allowedWidths = VIEWPORT_FRAMES[viewport];
  const width = allowedWidths.includes(frameWidth)
    ? frameWidth
    : VIEWPORT_DEFAULT_WIDTH[viewport];
  const size = frameChrome(viewport, width);
  const scale = zoom / 100;
  const previewSurface =
    colorMode === "light"
      ? { backgroundColor: "#f8fafc" }
      : { backgroundColor: theme.backgroundColor };

  const chrome = (
    <div
      className={`flex flex-col items-center gap-4 ${
        prominent ? "w-full" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-medium"
          role="group"
          aria-label="Modo do preview"
        >
          <button
            type="button"
            onClick={() => setInteraction("edit")}
            aria-pressed={interaction === "edit"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
              interaction === "edit"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setInteraction("view")}
            aria-pressed={interaction === "view"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
              interaction === "view"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Visualizar
          </button>
        </div>

        <div
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-medium"
          role="group"
          aria-label="Viewport do preview"
        >
          {(
            [
              { id: "mobile" as const, label: "Mobile", Icon: Smartphone },
              { id: "tablet" as const, label: "Tablet", Icon: Tablet },
              { id: "desktop" as const, label: "Desktop", Icon: Monitor },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewport(id)}
              aria-pressed={viewport === id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                viewport === id
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {allowedWidths.length > 1 ? (
          <div
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-medium"
            role="group"
            aria-label="Largura do preview"
          >
            {allowedWidths.map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setFrameWidth(entry)}
                aria-pressed={width === entry}
                className={`rounded-full px-2.5 py-1.5 tabular-nums transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                  width === entry
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {entry}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-medium"
          role="group"
          aria-label="Zoom do preview"
        >
          <button
            type="button"
            aria-label="Diminuir zoom"
            onClick={() => setZoom(nextZoom(zoom, "out"))}
            disabled={zoom === 50}
            className="rounded-full p-1.5 text-slate-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3rem] text-center tabular-nums text-slate-700">
            {zoom}%
          </span>
          <button
            type="button"
            aria-label="Aumentar zoom"
            onClick={() => setZoom(nextZoom(zoom, "in"))}
            disabled={zoom === 100}
            className="rounded-full p-1.5 text-slate-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-medium"
          role="group"
          aria-label="Fundo do preview"
        >
          <button
            type="button"
            onClick={() => setColorMode("light")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
              colorMode === "light"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-pressed={colorMode === "light"}
          >
            <Sun className="h-3.5 w-3.5" aria-hidden />
            Claro
          </button>
          <button
            type="button"
            onClick={() => setColorMode("dark")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
              colorMode === "dark"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-pressed={colorMode === "dark"}
          >
            <Moon className="h-3.5 w-3.5" aria-hidden />
            Escuro
          </button>
        </div>
      </div>

      <div
        className={`w-full overflow-auto rounded-2xl bg-[radial-gradient(circle_at_top,_#cbd5e1,_#f1f5f9_48%,_#e2e8f0)] p-6 ${
          prominent ? "min-h-[640px]" : ""
        }`}
      >
        <div
          className="mx-auto flex justify-center"
          style={{
            width: size.width * scale,
            height: size.height * scale,
          }}
        >
          <div
            className="origin-top bg-slate-950 shadow-[0_32px_80px_rgba(15,23,42,0.38)]"
            style={{
              width: size.width,
              height: size.height,
              borderRadius: size.radius,
              borderWidth: size.bezel,
              borderStyle: "solid",
              borderColor: "#0f172a",
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            {viewport !== "desktop" ? (
              <div className="flex justify-center py-1.5">
                <span className="h-1.5 w-20 rounded-full bg-slate-700" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="ml-3 truncate text-[10px] font-medium text-slate-400">
                  {settings.organizationName || "Cardápio digital"}
                </span>
              </div>
            )}

            <div
              ref={previewScrollRef}
              className="relative overflow-y-auto overflow-x-hidden"
              style={{
                ...previewSurface,
                height:
                  viewport === "desktop"
                    ? `calc(100% - 33px)`
                    : `calc(100% - 14px)`,
                borderRadius:
                  viewport === "desktop"
                    ? "0 0 0.85rem 0.85rem"
                    : "0 0 1.5rem 1.5rem",
              }}
              data-menu-preview="true"
              data-preview-mode="true"
              data-preview-interaction={interaction}
              data-preview-viewport={viewport}
              data-preview-width={width}
              data-preview-zoom={zoom}
            >
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2
                    className="h-6 w-6 animate-spin"
                    style={{ color: theme.mutedTextColor }}
                  />
                </div>
              ) : (
                <MenuPreviewSelectProvider
                  enabled={Boolean(onSelectTarget) && interaction === "edit"}
                  selected={selectedTarget}
                  onSelect={onSelectTarget ?? (() => undefined)}
                >
                  <DigitalOrderingProvider
                    store={previewSettings}
                    mode="pickup"
                    allowFulfillmentChoice={false}
                  >
                    <DigitalOrderingExperience
                      mode="pickup"
                      previewMode
                      previewProducts={products}
                      embedded
                      previewInspect={previewInspect}
                      scrollContainerRef={previewScrollRef}
                    />
                  </DigitalOrderingProvider>
                </MenuPreviewSelectProvider>
              )}
              {previewInspect === "productsheet" && products.length === 0 ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Preview · Ficha
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Nenhum produto no catálogo
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      A ficha usa um produto real quando houver. Nada é persistido.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-slate-400">
        Preview real com o motor do cardápio. Pedidos não são finalizados neste
        modo.
        {interaction === "edit"
          ? " Clique em um elemento para abrir as propriedades."
          : " Visualização limpa — ainda é preview."}
      </p>
    </div>
  );

  return (
    <>
      {showSheetTrigger ? (
        <button
          type="button"
          onClick={() => onSheetOpenChange?.(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          <Eye className="h-4 w-4" aria-hidden />
          Visualizar
        </button>
      ) : (
        chrome
      )}

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[70] flex flex-col justify-end bg-slate-950/50"
          role="dialog"
          aria-modal="true"
          aria-label="Preview do cardápio"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Fechar preview"
            onClick={() => onSheetOpenChange?.(false)}
          />
          <div className="relative max-h-[min(92vh,100dvh)] overflow-y-auto rounded-t-3xl bg-slate-50 px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Preview</p>
              <button
                type="button"
                onClick={() => onSheetOpenChange?.(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {chrome}
          </div>
        </div>
      ) : null}
    </>
  );
}
