import { describe, expect, it } from "vitest";
import { resolveFloatingAssistVisibility } from "@/components/layout/floatingAssistVisibility";

describe("resolveFloatingAssistVisibility", () => {
  it("oculta dock quando há modal/sheet aberto", () => {
    expect(
      resolveFloatingAssistVisibility({ overlayDepth: 1, aiDrawerOpen: false })
    ).toEqual({
      showDock: false,
      showFeedback: false,
      showCosmoFab: false,
      compact: true,
    });
  });

  it("mantém Cosmo e feedback no dock sem overlay", () => {
    expect(
      resolveFloatingAssistVisibility({ overlayDepth: 0, aiDrawerOpen: false })
    ).toEqual({
      showDock: true,
      showFeedback: true,
      showCosmoFab: true,
      compact: true,
    });
  });

  it("esconde feedback enquanto drawer da IA está aberto", () => {
    expect(
      resolveFloatingAssistVisibility({ overlayDepth: 0, aiDrawerOpen: true })
    ).toEqual({
      showDock: true,
      showFeedback: false,
      showCosmoFab: true,
      compact: true,
    });
  });
});
