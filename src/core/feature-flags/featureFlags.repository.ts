import { supabase } from "@/config/supabase";
import type { FeatureModule, OrganizationFeatureFlag } from "../types/featureFlags";

export async function getOrganizationFeatureFlags(organizationId: string) {
  const { data, error } = await supabase
    .from("organization_feature_flags")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) throw error;
  return (data ?? []) as OrganizationFeatureFlag[];
}

export async function upsertFeatureFlag(
  organizationId: string,
  moduleKey: FeatureModule,
  enabled: boolean,
  config: Record<string, unknown> = {}
) {
  const { data, error } = await supabase
    .from("organization_feature_flags")
    .upsert(
      {
        organization_id: organizationId,
        module_key: moduleKey,
        enabled,
        config,
      },
      { onConflict: "organization_id,module_key" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as OrganizationFeatureFlag;
}
