import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

if (typeof crypto.randomUUID !== "function") {
  let counter = 0;
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    value: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`,
  });
}
