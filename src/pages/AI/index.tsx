import { CosmoAiPanel, useCosmoAi } from "@/features/cosmo-ai";

export default function AI() {
  const { data, loading, analyzing, reload, resolveInsight, ignoreInsight } =
    useCosmoAi();

  return (
    <CosmoAiPanel
      data={data}
      loading={loading}
      analyzing={analyzing}
      onReload={() => void reload()}
      onResolve={resolveInsight}
      onIgnore={ignoreInsight}
    />
  );
}
