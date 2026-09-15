import type { FeatureModule } from "../types/featureFlags";
import {
  DEFAULT_ENABLED_MODULES,
  FEATURE_MODULE_LABELS,
} from "../types/featureFlags";
import { getOrganizationFeatureFlags } from "./featureFlags.repository";

class FeatureFlagEngineImpl {
  private organizationId: string | null = null;
  private flags = new Map<FeatureModule, boolean>();
  private loaded = false;

  async load(organizationId: string) {
    this.organizationId = organizationId;

    try {
      const rows = await getOrganizationFeatureFlags(organizationId);

      this.flags.clear();

      for (const module of DEFAULT_ENABLED_MODULES) {
        this.flags.set(module, true);
      }

      for (const row of rows) {
        this.flags.set(row.module_key, row.enabled);
      }

      this.loaded = true;
    } catch (error) {
      console.error("[FeatureFlagEngine] Falha ao carregar flags:", error);

      this.flags.clear();
      for (const module of DEFAULT_ENABLED_MODULES) {
        this.flags.set(module, true);
      }

      this.loaded = true;
    }
  }

  isEnabled(module: FeatureModule): boolean {
    if (!this.loaded) {
      return DEFAULT_ENABLED_MODULES.includes(module);
    }

    return this.flags.get(module) ?? false;
  }

  getEnabledModules(): FeatureModule[] {
    return [...this.flags.entries()]
      .filter(([, enabled]) => enabled)
      .map(([module]) => module);
  }

  getLabel(module: FeatureModule): string {
    return FEATURE_MODULE_LABELS[module];
  }

  clear() {
    this.organizationId = null;
    this.flags.clear();
    this.loaded = false;
  }

  getOrganizationId() {
    return this.organizationId;
  }
}

export const featureFlagEngine = new FeatureFlagEngineImpl();
