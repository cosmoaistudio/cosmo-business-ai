import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@cosmo/remote-commands": path.resolve(
        __dirname,
        "./packages/shared/remote-commands/index.ts"
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/features/product-engine/core/productBuilderCore.ts",
        "src/features/product-engine/core/ProductBuilder.ts",
        "src/features/product-engine/engines/ProductValidator.ts",
        "src/features/product-engine/engines/ProductPricingEngine.ts",
        "src/features/product-engine/engines/ProductDependencyEngine.ts",
        "src/features/product-engine/engines/ProductRulesEngine.ts",
        "src/lib/automation-events.ts",
        "src/features/automation/services/conditionEvaluator.service.ts",
        "src/features/dashboard/services/dashboard.service.ts",
        "src/features/remote-commands/remoteCommands.service.ts",
        "src/features/pdv/utils/compositionPricing.ts",
        "src/features/pdv/repository/pdv.repository.ts",
        "src/features/pdv/services/pdv.service.ts",
        "apps/desktop/electron/src/agent/CommandDispatcher.ts",
        "apps/desktop/electron/src/agent/CommandRegistry.ts",
        "apps/desktop/electron/src/agent/RealtimeListener.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/index.ts",
        "**/types/**",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
