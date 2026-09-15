import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],

  server: {
    host: "localhost",
    port: 5173,
    /** Fail if 5173 is taken — prevents Electron loading a stale Vite while a new one starts on 5174 */
    strictPort: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@cosmo/remote-commands": path.resolve(
        __dirname,
        "./packages/shared/remote-commands/index.ts"
      ),
    },
  },

  build: {
    rollupOptions: {
      output: {
        /**
         * Few stable vendor chunks for cache + smaller entry.
         * Page/feature code remains route-split via React.lazy.
         */
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return;

          if (
            normalized.includes("/node_modules/react-dom/") ||
            normalized.includes("/node_modules/react-router") ||
            normalized.includes("/node_modules/react/") ||
            normalized.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          if (normalized.includes("/node_modules/@supabase/")) {
            return "vendor-supabase";
          }

          if (normalized.includes("/node_modules/framer-motion/")) {
            return "vendor-motion";
          }

          // Do NOT force jspdf/xlsx/html2canvas into a shared chunk —
          // they must stay async-only (dynamic import) without modulepreload.

          if (normalized.includes("/node_modules/@tanstack/")) {
            return "vendor-query";
          }
        },
      },
    },
  },
});