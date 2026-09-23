import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppSheet from "@/components/shared/AppSheet";
import DigitalProductSheet from "@/features/digital-ordering/components/DigitalProductSheet";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

function SheetHarness({
  onClose,
}: {
  onClose?: () => void;
} = {}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button">375</button>
      <button type="button" onClick={() => setOpen(true)}>
        Açaí 300 ML
      </button>
      <AppSheet
        open={open}
        title="Açaí 300 ML"
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <button type="button">Campo 1</button>
        <button type="button">Campo 2</button>
      </AppSheet>
    </div>
  );
}

const menuProduct: DigitalMenuProduct = {
  id: "acai-300",
  name: "Açaí 300 ML",
  basePrice: 9.9,
  available: true,
  menuKind: "simple",
  imageUrl: null,
  categoryName: "Monte seu açaí",
  description: "Açaí cremoso",
  promotionalPrice: null,
  featured: true,
  groups: [],
};

describe("AppSheet focus", () => {
  it("A: opening from a trigger focuses the existing close control", () => {
    render(<SheetHarness />);
    const trigger = screen.getByRole("button", { name: "Açaí 300 ML" });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Açaí 300 ML" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("B: Tab from the last focusable element wraps to the first in the dialog", () => {
    render(<SheetHarness />);
    const trigger = screen.getByRole("button", { name: "Açaí 300 ML" });
    trigger.focus();
    fireEvent.click(trigger);

    screen.getByRole("button", { name: "Campo 2" }).focus();
    fireEvent.keyDown(window, { key: "Tab" });

    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("C: Shift+Tab from the first focusable element wraps to the last in the dialog", () => {
    render(<SheetHarness />);
    const trigger = screen.getByRole("button", { name: "Açaí 300 ML" });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "Campo 2" })).toHaveFocus();
  });

  it("D: Escape closes the sheet once", () => {
    const onClose = vi.fn();
    render(<SheetHarness onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "Açaí 300 ML" });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("E: Escape restores focus to the original trigger", () => {
    render(<SheetHarness />);
    const trigger = screen.getByRole("button", { name: "Açaí 300 ML" });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(trigger).toHaveFocus();
    expect(screen.getByRole("button", { name: "375" })).not.toHaveFocus();
  });

  it("F: closing with a detached trigger does not throw and does not focus editor chrome", () => {
    render(<SheetHarness />);
    const trigger = screen.getByRole("button", { name: "Açaí 300 ML" });
    trigger.focus();
    fireEvent.click(trigger);
    trigger.remove();

    expect(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    }).not.toThrow();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "375" })).not.toHaveFocus();
  });

  it("G: ProductSheet Escape does not send focus to editor chrome", () => {
    function ProductSheetHarness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button">375</button>
          <button type="button" onClick={() => setOpen(true)}>
            Açaí 300 ML, A partir de R$ 9,90
          </button>
          <DigitalProductSheet
            productId="acai-300"
            menuProduct={menuProduct}
            open={open}
            onClose={() => setOpen(false)}
            onAddToCart={vi.fn()}
          />
        </div>
      );
    }

    render(<ProductSheetHarness />);
    const trigger = screen.getByRole("button", {
      name: "Açaí 300 ML, A partir de R$ 9,90",
    });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole("button", { name: "375" })).not.toHaveFocus();
  });
});
